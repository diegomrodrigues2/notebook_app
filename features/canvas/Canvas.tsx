
import React, { useRef, useEffect, useState } from 'react';
import rough from 'roughjs';
import { RoughSVG } from 'roughjs/bin/svg';
import { CanvasElement, Tool, TextElement } from '../../types/elements';
import { Shape } from './Shape';
import { EditorAction, EditorState, Page } from '../editor/editor.types';
import { A4_WIDTH, A4_HEIGHT, PAGE_GAP } from '../../constants';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { SelectionBox } from './components/SelectionBox';
import { GroupSelectionBox } from './components/GroupSelectionBox';
import { TextEditor } from './components/TextEditor';

interface CanvasProps {
  leftPage: Page | null;
  rightPage: Page | null;
  interactionState: EditorState['interactionState'];
  selectedTool: Tool;
  selectedElement: { pageId: string, elementId: string } | null;
  selectedIds: { pageId: string; elementIds: string[] } | null;
  currentElementId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  camera: { x: number; y: number; zoom: number };
  isSpacePressed: boolean;
  marqueeRect: EditorState['marqueeRect'];
}

export function Canvas({
  leftPage,
  rightPage,
  interactionState,
  selectedTool,
  selectedElement,
  selectedIds,
  currentElementId,
  dispatch,
  camera,
  isSpacePressed,
  marqueeRect,
}: CanvasProps): React.ReactNode {
  const svgRef = useRef<SVGSVGElement>(null);
  const [roughSvg, setRoughSvg] = useState<RoughSVG | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      setRoughSvg(rough.svg(svgRef.current));
    }
  }, []);

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleShapePointerDown,
    handleResizePointerDown,
    getCursor,
  } = useCanvasInteraction({
    camera,
    dispatch,
    interactionState,
    isSpacePressed,
    leftPage,
    rightPage,
    selectedElement,
    selectedIds,
    selectedTool,
    svgRef,
  });

  const allElements = [
    ...(leftPage?.elements.map(el => ({ ...el, pageId: leftPage.id, pageOffset: 0 })) || []),
    ...(rightPage?.elements.map(el => ({ ...el, pageId: rightPage.id, pageOffset: A4_WIDTH + PAGE_GAP })) || [])
  ];

  const selectedElementObject = selectedElement ? allElements.find(el => el.id === selectedElement.elementId) : null;
  
  const groupBounds = (() => {
    if (!selectedIds || selectedIds.elementIds.length < 2) return null;
    const pageOffset = selectedIds.pageId === rightPage?.id ? (A4_WIDTH + PAGE_GAP) : 0;
    const els = allElements.filter(e => e.pageId === selectedIds.pageId && selectedIds.elementIds.includes(e.id));
    if (els.length < 2) return null;
    const minX = Math.min(...els.map(e => e.x));
    const minY = Math.min(...els.map(e => e.y));
    const maxX = Math.max(...els.map(e => e.x + e.width));
    const maxY = Math.max(...els.map(e => e.y + e.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, pageOffset };
  })();

  const editingElementInfo = (interactionState === 'EDITING_TEXT' && currentElementId
    ? allElements.find(el => el.id === currentElementId && el.type === 'TEXT')
    : null) as (TextElement & { pageId: string, pageOffset: number }) | null;


  if (!leftPage && !rightPage) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f1f3f5' }}>
        <div className="text-center text-gray-500">
            <h2 className="text-2xl font-semibold">Workspace Vazio</h2>
            <p className="mt-2">Crie um novo caderno para começar.</p>
        </div>
      </div>
    );
  }

  const isSelected = (id: string) => {
    if (selectedIds) return selectedIds.elementIds.includes(id);
    return selectedElement?.elementId === id;
  }

  return (
    <div className="w-full h-full" style={{ backgroundColor: '#f1f3f5' }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: getCursor() }}
      >
        <defs>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
            </filter>
        </defs>
        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
          {leftPage && (
            <g>
              <rect x="0" y="0" width={A4_WIDTH} height={A4_HEIGHT} fill="white" filter="url(#shadow)" pointerEvents="none" />
              {leftPage.elements.slice().sort((a, b) => a.zIndex - b.zIndex).map(element => (
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={isSelected(element.id)} pageId={leftPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null} />
              ))}
            </g>
          )}

          {rightPage && (
            <g transform={`translate(${A4_WIDTH + PAGE_GAP}, 0)`}>
              <rect x="0" y="0" width={A4_WIDTH} height={A4_HEIGHT} fill="white" filter="url(#shadow)" pointerEvents="none" />
              {rightPage.elements.slice().sort((a, b) => a.zIndex - b.zIndex).map(element => (
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={isSelected(element.id)} pageId={rightPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null}/>
              ))}
            </g>
          )}

          {interactionState === 'MARQUEE_SELECTING' && marqueeRect && (
            <g transform={`translate(${marqueeRect.pageId === rightPage?.id ? (A4_WIDTH + PAGE_GAP) : 0}, 0)`}>
              <rect
                x={marqueeRect.x}
                y={marqueeRect.y}
                width={marqueeRect.width}
                height={marqueeRect.height}
                fill="rgba(0, 102, 255, 0.1)"
                stroke="rgba(0, 102, 255, 0.7)"
                strokeWidth={1 / camera.zoom}
              />
            </g>
          )}

          {selectedElementObject && !groupBounds && (
            <SelectionBox
              selectedElementObject={selectedElementObject}
              camera={camera}
              onResizePointerDown={handleResizePointerDown}
            />
          )}

          {groupBounds && (
            <GroupSelectionBox
              bounds={groupBounds}
              camera={camera}
              onResizePointerDown={handleResizePointerDown}
            />
          )}
        </g>
      </svg>
      {editingElementInfo && (
        <TextEditor 
          editingElementInfo={editingElementInfo}
          camera={camera}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}