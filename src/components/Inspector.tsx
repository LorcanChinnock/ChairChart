"use client";

import React, { useState, useEffect } from "react";
import { useInspector, useCloseInspector } from "../store/ui-store";
import { useUpdateTable, useDeleteTable, usePlanStore } from "../store/plan-store";
import type { Table, TableShape } from "../types";

interface ConfirmDeleteProps {
  isOpen: boolean;
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ isOpen, tableName, onConfirm, onCancel }: ConfirmDeleteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" role="dialog" aria-labelledby="delete-title">
        <h3 id="delete-title" className="text-lg font-semibold text-gray-900 mb-4">
          Delete Table
        </h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete &quot;{tableName}&quot;? This action cannot be undone and will remove all seat assignments for this table.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inspector() {
  const inspector = useInspector();
  const closeInspector = useCloseInspector();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const getTable = usePlanStore((state) => state.getTable);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Get the current table
  const table = inspector.tableId ? getTable(inspector.tableId) : null;
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    shape: "round" as TableShape,
    seatCount: 8,
  });
  
  // Update form data when table changes
  useEffect(() => {
    if (table) {
      setFormData({
        name: table.name,
        shape: table.shape,
        seatCount: table.seatCount,
      });
    }
  }, [table]);
  
  // Reset delete confirmation when inspector closes
  useEffect(() => {
    if (!inspector.isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [inspector.isOpen]);
  
  if (!inspector.isOpen || !table) return null;
  
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    const newValue = field === 'seatCount' ? Math.max(1, Math.min(20, Number(value))) : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue,
    }));
    
    // Update table immediately for live preview
    if (inspector.tableId) {
      const updates: Partial<Table> = { [field]: newValue };
      
      // Adjust size when changing shape
      if (field === 'shape') {
        const shape = newValue as TableShape;
        if (shape === 'round') {
          updates.size = { width: 120, height: 120 };
        } else if (shape === 'square') {
          updates.size = { width: 120, height: 120 };
        } else if (shape === 'rect') {
          updates.size = { width: 160, height: 80 };
        }
      }
      
      updateTable(inspector.tableId, updates);
    }
  };
  
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (inspector.tableId) {
      deleteTable(inspector.tableId);
      closeInspector();
    }
    setShowDeleteConfirm(false);
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  return (
    <>
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Table Inspector</h2>
          <button
            onClick={closeInspector}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close inspector"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Table Name */}
            <div>
              <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-2">
                Table Name
              </label>
              <input
                id="tableName"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter table name"
              />
            </div>
            
            {/* Shape Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Table Shape
              </label>
              <div className="space-y-2">
                {(['round', 'square', 'rect'] as const).map((shape) => (
                  <label key={shape} className="flex items-center">
                    <input
                      type="radio"
                      value={shape}
                      checked={formData.shape === shape}
                      onChange={(e) => handleInputChange('shape', e.target.value as TableShape)}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {shape === 'rect' ? 'Rectangle' : shape}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Seat Count */}
            <div>
              <label htmlFor="seatCount" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Seats
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="seatCount"
                  type="range"
                  min="1"
                  max="20"
                  value={formData.seatCount}
                  onChange={(e) => handleInputChange('seatCount', e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.seatCount}
                  onChange={(e) => handleInputChange('seatCount', e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Range: 1-20 seats
              </p>
            </div>
            
            {/* Table Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Settings</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Shape: <span className="capitalize">{formData.shape === 'rect' ? 'Rectangle' : formData.shape}</span></div>
                <div>Seats: {formData.seatCount}</div>
                <div>Position: ({Math.round(table.position.x)}, {Math.round(table.position.y)})</div>
                <div>Size: {Math.round(table.size.width)} × {Math.round(table.size.height)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Table
          </button>
        </div>
      </div>
      
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={showDeleteConfirm}
        tableName={table.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}