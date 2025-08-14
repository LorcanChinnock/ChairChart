"use client";

import React from "react";
import { useAddTable } from "../store/plan-store";

interface ToolbarProps {
  isDarkMode?: boolean;
  canvasCenter?: { x: number; y: number };
}

export default function Toolbar({
  isDarkMode = false,
  canvasCenter = { x: 0, y: 0 }
}: ToolbarProps) {
  const addTable = useAddTable();
  
  // Button styling based on theme
  const buttonStyle = {
    backgroundColor: isDarkMode ? "#1e3a5f" : "#f5f1e8",
    color: isDarkMode ? "#e2e8f0" : "#374151",
    border: isDarkMode ? "1px solid #2d4a6b" : "1px solid #d4c4a8",
    padding: "10px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
  
  const handleAddTable = () => {
    // Create table at the current canvas center (world coordinates)
    addTable(canvasCenter);
  };
  
  return (
    <div className="absolute top-4 left-4 z-10 select-none">
      <div
        style={{
          backgroundColor: isDarkMode ? "rgba(30, 58, 95, 0.9)" : "rgba(245, 241, 232, 0.9)",
          border: isDarkMode ? "1px solid #2d4a6b" : "1px solid #d4c4a8",
          borderRadius: "8px",
          padding: "8px",
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          type="button"
          onClick={handleAddTable}
          style={buttonStyle}
          title="Add a new table with 8 seats"
          aria-label="Add table"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? "#2d4a6b" : "#ede7db";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? "#1e3a5f" : "#f5f1e8";
          }}
        >
          <span style={{ fontSize: "16px" }}>⚪</span>
          Add Table
        </button>
      </div>
    </div>
  );
}