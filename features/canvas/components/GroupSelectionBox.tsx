import React from 'react';
import { ResizeHandle } from '../../../types/elements';

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = HANDLE_SIZE / 2;

interface GroupSelectionBoxProps {
  bounds: { x: number; y: number; width: number; height: number; pageOffset: number };
  camera: { x: number; y: number; zoom: number };
  onResizePointerDown: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

export function GroupSelectionBox({ bounds, camera, onResizePointerDown }: GroupSelectionBoxProps): React.ReactNode {
  const { x, y, width, height, pageOffset } = bounds;

  const handles: { handle: ResizeHandle; x: number; y: number; cursor: string }[] = [
    { handle: 'nw', x: x - HANDLE_OFFSET, y: y - HANDLE_OFFSET, cursor: 'nwse-resize' },
    { handle: 'n',  x: x + width / 2 - HANDLE_OFFSET, y: y - HANDLE_OFFSET, cursor: 'ns-resize' },
    { handle: 'ne', x: x + width - HANDLE_OFFSET, y: y - HANDLE_OFFSET, cursor: 'nesw-resize' },
    { handle: 'e',  x: x + width - HANDLE_OFFSET, y: y + height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
    { handle: 'se', x: x + width - HANDLE_OFFSET, y: y + height - HANDLE_OFFSET, cursor: 'nwse-resize' },
    { handle: 's',  x: x + width / 2 - HANDLE_OFFSET, y: y + height - HANDLE_OFFSET, cursor: 'ns-resize' },
    { handle: 'sw', x: x - HANDLE_OFFSET, y: y + height - HANDLE_OFFSET, cursor: 'nesw-resize' },
    { handle: 'w',  x: x - HANDLE_OFFSET, y: y + height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
  ];

  return (
    <g transform={`translate(${pageOffset}, 0)`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="rgba(0, 102, 255, 0.7)"
        strokeWidth={1 / camera.zoom}
        strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`}
        pointerEvents="none"
      />
      {handles.map(({ handle, x, y, cursor }) => (
        <rect
          key={handle}
          x={x}
          y={y}
          width={HANDLE_SIZE / camera.zoom}
          height={HANDLE_SIZE / camera.zoom}
          fill="white"
          stroke="rgba(0, 102, 255, 0.7)"
          strokeWidth={1 / camera.zoom}
          style={{ cursor }}
          onPointerDown={(e) => onResizePointerDown(e, handle)}
        />
      ))}
    </g>
  );
}