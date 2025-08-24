
import React, { useRef, useEffect, useState } from 'react';
import rough from 'roughjs';
import { RoughSVG } from 'roughjs/bin/svg';
import { CanvasElement, Tool, TextElement } from '../../types/elements';
import { Shape } from './Shape';
import { EditorAction, EditorState, Page } from '../editor/editor.types';
import { A4_WIDTH, A4_HEIGHT, PAGE_GAP } from '../../constants';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { SelectionBox } from './components/SelectionBox';
import { TextEditor } from './components/TextEditor';

interface CanvasProps {
  leftPage: Page | null;
  rightPage: Page | null;
  interactionState: EditorState['interactionState'];
  selectedTool: Tool;
  selectedElement: { pageId: string, elementId: string } | null;
  currentElementId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  camera: { x: number; y: number; zoom: number };
  isSpacePressed: boolean;
}

export function Canvas({
  leftPage,
  rightPage,
  interactionState,
  selectedTool,
  selectedElement,
  currentElementId,
  dispatch,
  camera,
  isSpacePressed,
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
    selectedTool,
    svgRef,
  });

  const allElements = [
    ...(leftPage?.elements.map(el => ({ ...el, pageId: leftPage.id, pageOffset: 0 })) || []),
    ...(rightPage?.elements.map(el => ({ ...el, pageId: rightPage.id, pageOffset: A4_WIDTH + PAGE_GAP })) || [])
  ];

  const selectedElementObject = selectedElement ? allElements.find(el => el.id === selectedElement.elementId) : null;
  const editingElementInfo = (interactionState === 'EDITING_TEXT' && currentElementId
    ? allElements.find(el => el.id === currentElementId && el.type === 'TEXT')
    : null) as (TextElement & { pageId: string, pageOffset: number }) | null;


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
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={element.id === selectedElement?.elementId} pageId={leftPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null} />
              ))}
            </g>
          )}

          {rightPage && (
            <g transform={`translate(${A4_WIDTH + PAGE_GAP}, 0)`}>
              <rect x="0" y="0" width={A4_WIDTH} height={A4_HEIGHT} fill="white" filter="url(#shadow)" pointerEvents="none" />
              {rightPage.elements.slice().sort((a, b) => a.zIndex - b.zIndex).map(element => (
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={element.id === selectedElement?.elementId} pageId={rightPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null}/>
              ))}
            </g>
          )}

          {selectedElementObject && (
            <SelectionBox
              selectedElementObject={selectedElementObject}
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