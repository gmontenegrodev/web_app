import React from 'react';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-red-50 text-red-800 px-3 py-2 rounded mb-2 text-sm">
      {message}
    </div>
  );
}


