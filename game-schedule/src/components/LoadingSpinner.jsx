import React from 'react';

export default function LoadingSpinner({ label = 'Loading…' }) {
  return <div role="status" className="py-2 text-sm text-gray-600">{label}</div>;
}


