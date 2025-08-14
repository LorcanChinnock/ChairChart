import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Toolbar from "../Toolbar";

// Mock the plan store
const mockAddTable = vi.fn();
vi.mock("../../store/plan-store", () => ({
  useAddTable: () => mockAddTable,
}));

describe("Toolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderToolbar = (props: Partial<React.ComponentProps<typeof Toolbar>> = {}) => {
    const defaultProps = {
      isDarkMode: false,
      canvasCenter: { x: 100, y: 50 },
    };

    return render(<Toolbar {...defaultProps} {...props} />);
  };

  describe("rendering", () => {
    it("should render Add Table button", () => {
      const { getByRole } = renderToolbar();
      
      const button = getByRole("button", { name: /add table/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Add Table");
    });

    it("should have correct accessibility attributes", () => {
      const { getByRole } = renderToolbar();
      
      const button = getByRole("button", { name: /add table/i });
      expect(button).toHaveAttribute("title", "Add a new table with 8 seats");
      expect(button).toHaveAttribute("aria-label", "Add table");
    });

    it("should display table icon", () => {
      const { getByRole } = renderToolbar();
      
      const button = getByRole("button", { name: /add table/i });
      expect(button).toHaveTextContent("⚪"); // Table icon
    });
  });

  describe("theming", () => {
    it("should apply light mode styling", () => {
      const { getByRole } = renderToolbar({ isDarkMode: false });
      
      const button = getByRole("button", { name: /add table/i });
      
      // Check computed styles
      const computedStyle = window.getComputedStyle(button);
      expect(computedStyle.backgroundColor).toBe("rgb(245, 241, 232)"); // #f5f1e8
      expect(computedStyle.color).toBe("rgb(55, 65, 81)"); // #374151
    });

    it("should apply dark mode styling", () => {
      const { getByRole } = renderToolbar({ isDarkMode: true });
      
      const button = getByRole("button", { name: /add table/i });
      
      const computedStyle = window.getComputedStyle(button);
      expect(computedStyle.backgroundColor).toBe("rgb(30, 58, 95)"); // #1e3a5f
      expect(computedStyle.color).toBe("rgb(226, 232, 240)"); // #e2e8f0
    });

    it("should apply dark mode container styling", () => {
      const { container } = renderToolbar({ isDarkMode: true });
      
      const toolbarContainer = container.firstChild?.firstChild as HTMLElement;
      const computedStyle = window.getComputedStyle(toolbarContainer);
      
      expect(computedStyle.backgroundColor).toBe("rgba(30, 58, 95, 0.9)");
      expect(computedStyle.border).toBe("1px solid rgb(45, 74, 107)"); // #2d4a6b
    });

    it("should apply light mode container styling", () => {
      const { container } = renderToolbar({ isDarkMode: false });
      
      const toolbarContainer = container.firstChild?.firstChild as HTMLElement;
      const computedStyle = window.getComputedStyle(toolbarContainer);
      
      expect(computedStyle.backgroundColor).toBe("rgba(245, 241, 232, 0.9)");
      expect(computedStyle.border).toBe("1px solid rgb(212, 196, 168)"); // #d4c4a8
    });
  });

  describe("interactions", () => {
    it("should call addTable with canvas center when clicked", () => {
      const canvasCenter = { x: 150, y: 75 };
      const { getByRole } = renderToolbar({ canvasCenter });
      
      const button = getByRole("button", { name: /add table/i });
      fireEvent.click(button);
      
      expect(mockAddTable).toHaveBeenCalledWith(canvasCenter);
      expect(mockAddTable).toHaveBeenCalledTimes(1);
    });

    it("should use default canvas center when not provided", () => {
      const { getByRole } = renderToolbar({ canvasCenter: undefined });
      
      const button = getByRole("button", { name: /add table/i });
      fireEvent.click(button);
      
      expect(mockAddTable).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it("should handle multiple clicks", () => {
      const { getByRole } = renderToolbar();
      
      const button = getByRole("button", { name: /add table/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockAddTable).toHaveBeenCalledTimes(3);
    });

    it("should handle hover effects", () => {
      const { getByRole } = renderToolbar({ isDarkMode: false });
      
      const button = getByRole("button", { name: /add table/i });
      
      // Initial state
      expect(window.getComputedStyle(button).backgroundColor).toBe("rgb(245, 241, 232)");
      
      // Hover state
      fireEvent.mouseEnter(button);
      expect(window.getComputedStyle(button).backgroundColor).toBe("rgb(237, 231, 219)"); // #ede7db
      
      // Leave state
      fireEvent.mouseLeave(button);
      expect(window.getComputedStyle(button).backgroundColor).toBe("rgb(245, 241, 232)");
    });

    it("should handle hover effects in dark mode", () => {
      const { getByRole } = renderToolbar({ isDarkMode: true });
      
      const button = getByRole("button", { name: /add table/i });
      
      fireEvent.mouseEnter(button);
      expect(window.getComputedStyle(button).backgroundColor).toBe("rgb(45, 74, 107)"); // #2d4a6b
      
      fireEvent.mouseLeave(button);
      expect(window.getComputedStyle(button).backgroundColor).toBe("rgb(30, 58, 95)"); // #1e3a5f
    });
  });

  describe("positioning", () => {
    it("should be positioned in top-left corner", () => {
      const { container } = renderToolbar();
      
      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass("absolute", "top-4", "left-4", "z-10");
    });

    it("should not be selectable", () => {
      const { container } = renderToolbar();
      
      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass("select-none");
    });
  });

  describe("styling", () => {
    it("should have proper backdrop blur and shadow", () => {
      const { container } = renderToolbar();
      
      const toolbarContainer = container.firstChild?.firstChild as HTMLElement;
      
      // Check inline styles since jsdom doesn't support backdrop-filter in computed styles
      expect(toolbarContainer.style.backdropFilter).toBe("blur(4px)");
      expect(toolbarContainer.style.boxShadow).toBe("0 4px 6px rgba(0, 0, 0, 0.1)");
    });

    it("should have rounded corners", () => {
      const { container } = renderToolbar();
      
      const toolbarContainer = container.firstChild?.firstChild as HTMLElement;
      const button = container.querySelector("button") as HTMLElement;
      
      expect(window.getComputedStyle(toolbarContainer).borderRadius).toBe("8px");
      expect(window.getComputedStyle(button).borderRadius).toBe("6px");
    });
  });
});