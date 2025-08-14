# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context

ChairChart is a client-side seating chart planner for weddings and events. It's a **Next.js 15** application with **React 19**, **TypeScript 5**, and **Tailwind CSS 4**, configured for static export to GitHub Pages.

## Tech Stack
- **Framework**: Next.js 15 (App Router, static export)
- **Canvas**: Konva.js with react-konva for 2D graphics
- **State Management**: Zustand stores (plan-store.ts, ui-store.ts)
- **Testing**: Vitest with @testing-library/react
- **Styling**: Tailwind CSS 4 with PostCSS
- **Type Safety**: Zod schemas for data validation

## Essential Commands

### Development
- `pnpm dev` - Start development server (uses Turbopack)
- `pnpm build` - Build for production (static export to `/out`)
- `pnpm start` - Start production server (won't work, use static serve instead)

### Testing
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage report

### Code Quality
- `pnpm lint` - Run Next.js ESLint

## Architecture Overview

### State Management Pattern
The app uses **two separate Zustand stores**:

1. **plan-store.ts**: Domain logic (tables, seats, attendees)
   - Table CRUD operations with nanoid generation
   - Table selection management
   - Convenience hooks like `useTables()`, `useAddTable()`

2. **ui-store.ts**: UI state (zoom, pan, inspector, selections)
   - Canvas viewport state (zoom/pan)
   - Inspector panel state
   - Selection rectangles and UI interactions

### Component Architecture
- **CanvasStage.tsx**: Main canvas component using Konva Stage/Layer
  - Handles zoom/pan with smooth animations
  - Keyboard shortcuts (Space for pan, +/- for zoom, arrows for navigation)
  - Dark/light theme toggle (manual, no system detection)
  - Grid rendering with dynamic line calculations

- **TableNode.tsx**: Individual table rendering (round/rect/square shapes)
- **SeatNode.tsx**: Individual seat rendering around table perimeters
- **Inspector.tsx**: Right-panel for table/seat details
- **Toolbar.tsx**: Left-panel with table creation tools

### Canvas Coordinate System
- **Screen space**: Browser viewport coordinates
- **World space**: Infinite canvas coordinates  
- **Transforms**: `src/utils/canvasTransforms.ts` for coordinate conversions
- **Seat geometry**: `src/utils/seatGeometry.ts` for positioning seats around tables

### Static Export Configuration
The app deploys to GitHub Pages under `/ChairChart`:
- `next.config.mjs`: Handles basePath/assetPrefix in production only
- `process.env.NEXT_PUBLIC_BASE_PATH` available to client for asset URLs
- **Dev**: Assets load from `/` (e.g., `/next.svg`)
- **Production**: Assets load from `/ChairChart/` (e.g., `/ChairChart/next.svg`)

### Testing Setup
Comprehensive test infrastructure in `src/test-setup.ts`:
- **Mocks**: Canvas APIs, react-konva components, ResizeObserver, matchMedia
- **Pattern**: Each component/store/util has a `__tests__/` directory
- **Coverage**: Tests cover Zustand store logic, canvas interactions, utilities
- Canvas/Konva mocking allows testing without DOM canvas support

### Type System
Strong typing with Zod validation in `src/types/index.ts`:
- `Table`, `Attendee`, `SeatAssignment`, `Plan` schemas
- Runtime validation for data integrity
- TypeScript inference from Zod schemas

## Development Patterns

### Adding New Tables
1. Use `useAddTable()` hook from plan-store
2. Tables auto-generate unique IDs (nanoid) and names ("Table 1", "Table 2", etc.)
3. Default to round tables with 8 seats at canvas center

### Canvas Interactions
- **Panning**: Space + drag, middle mouse, or manual left-click on empty stage
- **Zooming**: Ctrl/Cmd + wheel, or keyboard +/-/0
- **Selection**: Click tables to select, double-click to open inspector
- **Keyboard**: Arrow keys pan, Shift+arrows for larger steps

### Component Testing
- Always mock react-konva components in tests (see test-setup.ts)
- Use `@testing-library/react` for component tests
- Mock Zustand stores when testing isolated components
- Test canvas interactions by mocking Stage/Layer event handlers

## File Organization

### Key Directories to Understand
- `src/store/` - Zustand state management
- `src/components/` - React components with co-located `__tests__/`
- `src/utils/` - Pure functions (canvas math, geometry)
- `src/types/` - TypeScript/Zod type definitions
- `src/shims/` - Module shims (canvas polyfill)

### Ignore These Directories
- `node_modules/`, `out/`, `dist/`, `coverage/`, `.next/`, `temp/`

## When Making Changes
1. **Always run tests before committing**: `pnpm test`
2. **Update co-located tests** when modifying components
3. **Use semantic commit messages**: feat:, fix:, docs:, test:, refactor:
4. **Check static build works**: `pnpm build` then serve `/out`
5. **Verify both light and dark theme** if changing UI components