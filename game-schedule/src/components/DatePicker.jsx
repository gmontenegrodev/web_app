import React from 'react';
import { formatDateInputValue } from '../utils/formatters';

// Simple date picker component - using HTML5 date input
export default function DatePicker({ date, onChange }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <label htmlFor="schedule-date" className="text-sm text-gray-700">Select Date:</label>
      <input
        id="schedule-date"
        type="date"
        className="border rounded px-2 py-1 text-sm"
        value={date || formatDateInputValue(new Date())}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}


