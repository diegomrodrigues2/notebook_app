
import React from 'react';
import { CanvasElement, ResizeHandle } from '../../../types/elements';

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = HANDLE_SIZE / 2;

interface SelectionBoxProps {
    selectedElementObject: CanvasElement & { pageOffset: number };
    camera: { x: number; y: number; zoom: number };
    onResizePointerDown: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

export function SelectionBox({ selectedElementObject, camera, onResizePointerDown }: SelectionBoxProps) {
    const handles: { handle: ResizeHandle, x: number, y: number, cursor: string }[] = [
        { handle: 'nw', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'nwse-resize' },
        { handle: 'n', x: selectedElementObject.x + selectedElementObject.width / 2 - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'ns-resize' },
        { handle: 'ne', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'nesw-resize' },
        { handle: 'e', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
        { handle: 'se', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'nwse-resize' },
        { handle: 's', x: selectedElementObject.x + selectedElementObject.width / 2 - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'ns-resize' },
        { handle: 'sw', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'nesw-resize' },
        { handle: 'w', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
    ];

    return (
        <g transform={`translate(${selectedElementObject.pageOffset}, 0)`}>
            <rect
                x={selectedElementObject.x}
                y={selectedElementObject.y}
                width={selectedElementObject.width}
                height={selectedElementObject.height}
                fill="none"
                stroke="rgba(0, 102, 255, 0.7)"
                strokeWidth={1 / camera.zoom}
                strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`}
                pointerEvents="none"
            />
            {handles.map(({handle, x, y, cursor}) => (
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
