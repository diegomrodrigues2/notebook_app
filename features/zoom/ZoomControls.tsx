import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset }: ZoomControlsProps): React.ReactNode {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 border border-gray-200">
      <button
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700 text-lg font-bold"
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
      <button 
        onClick={onZoomReset}
        className="w-16 text-sm text-gray-700 hover:bg-gray-100 rounded-md py-1"
        title="Reset zoom"
      >
        {zoomPercentage}%
      </button>
      <button
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700 text-lg font-bold"
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}
