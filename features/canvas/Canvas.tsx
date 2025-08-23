
import React, { useRef, useCallback, useEffect, useState } from 'react';
import rough from 'roughjs';
import { RoughSVG } from 'roughjs/bin/svg';
import { CanvasElement, ResizeHandle, Tool, TextElement } from '../../types/elements';
import { Shape } from './Shape';
import { getSVGCoordinates } from '../../utils/geometry';
import { EditorAction, EditorState, Page } from '../editor/editorReducer';
import { A4_WIDTH, A4_HEIGHT, PAGE_GAP } from '../../constants';

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

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = HANDLE_SIZE / 2;

export function Canvas({ leftPage, rightPage, interactionState, selectedTool, selectedElement, currentElementId, dispatch, camera, isSpacePressed }: CanvasProps): React.ReactNode {
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingText, setEditingText] = useState('');
  const [roughSvg, setRoughSvg] = useState<RoughSVG | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      setRoughSvg(rough.svg(svgRef.current));
    }
  }, []);

  const getCoords = useCallback((event: { clientX: number, clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    return getSVGCoordinates(svgRef.current, event);
  }, []);

  const getInteractionContext = useCallback((event: { clientX: number, clientY: number }): { pageId: string, coords: { x: number, y: number } } | null => {
      if (!svgRef.current) return null;
      const { x: svgX, y: svgY } = getSVGCoordinates(svgRef.current, event);
      const worldX = (svgX - camera.x) / camera.zoom;
      const worldY = (svgY - camera.y) / camera.zoom;

      if (leftPage && worldX >= 0 && worldX < A4_WIDTH && worldY >= 0 && worldY < A4_HEIGHT) {
          return { pageId: leftPage.id, coords: { x: worldX, y: worldY } };
      }
      
      const rightPageXStart = A4_WIDTH + PAGE_GAP;
      if (rightPage && worldX >= rightPageXStart && worldX < rightPageXStart + A4_WIDTH && worldY >= 0 && worldY < A4_HEIGHT) {
          return { pageId: rightPage.id, coords: { x: worldX - rightPageXStart, y: worldY } };
      }
      
      return null;
  }, [camera.x, camera.y, camera.zoom, leftPage, rightPage]);

  const allElements = [
    ...(leftPage?.elements.map(el => ({ ...el, pageId: leftPage.id, pageOffset: 0 })) || []),
    ...(rightPage?.elements.map(el => ({ ...el, pageId: rightPage.id, pageOffset: A4_WIDTH + PAGE_GAP })) || [])
  ];

  const editingElementInfo = (interactionState === 'EDITING_TEXT' && currentElementId
    ? allElements.find(el => el.id === currentElementId && el.type === 'TEXT')
    : null) as (TextElement & { pageId: string, pageOffset: number }) | null;

  useEffect(() => {
    if (editingElementInfo) {
        setEditingText(editingElementInfo.text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [editingElementInfo]);

  const measureText = (text: string, fontSize: number, fontFamily: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return { width: 0, height: 0 };
    context.font = `${fontSize}px ${fontFamily}`;
    const lines = text.split('\n');
    const width = Math.max(...lines.map(line => context.measureText(line).width));
    const height = lines.length * fontSize * 1.2; // 1.2 line height
    return { width: width || 10, height: height || fontSize };
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingElementInfo) return;
    const newText = event.target.value;
    setEditingText(newText);
    const { width, height } = measureText(newText, editingElementInfo.fontSize, editingElementInfo.fontFamily);
    dispatch({ type: 'EDIT_ELEMENT_TEXT', payload: { text: newText, width, height }});
  };

  const handleTextareaBlur = () => {
    dispatch({ type: 'FINISH_INTERACTION' });
  };
  
  const handlePointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.target !== svgRef.current) return;
    
    if (isSpacePressed || event.button === 1 || selectedTool === 'HAND') {
        dispatch({ type: 'START_PANNING', payload: getCoords(event) });
        return;
    }
    
    const context = getInteractionContext(event);
    if (!context) {
        if (selectedTool === 'SELECT') dispatch({ type: 'CLEAR_SELECTION' });
        return;
    }

    if (selectedTool !== 'SELECT') {
      dispatch({ type: 'START_DRAWING', payload: { ...context.coords, pageId: context.pageId } });
    } else {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  }, [dispatch, selectedTool, getCoords, getInteractionContext, isSpacePressed]);
  
  const handleShapePointerDown = useCallback((event: React.PointerEvent, elementId: string, pageId: string) => {
     event.stopPropagation();
     
     if (event.detail === 2 && selectedTool === 'SELECT') {
        dispatch({ type: 'START_EDITING_TEXT', payload: { elementId, pageId } });
        return;
     }

     const context = getInteractionContext(event);
     if (!context) return;

     if (selectedTool === 'SELECT') {
        if(selectedElement?.elementId === elementId) {
            dispatch({ type: 'START_MOVING', payload: context.coords });
        } else {
            dispatch({ type: 'SELECT_ELEMENT', payload: { elementId, pageId } });
        }
     }
  }, [dispatch, selectedTool, getInteractionContext, selectedElement]);

  const handleResizePointerDown = useCallback((event: React.PointerEvent, handle: ResizeHandle) => {
    event.stopPropagation();
    const context = getInteractionContext(event);
    if (!context) return;
    dispatch({ type: 'START_RESIZING', payload: { ...context.coords, handle } });
  }, [dispatch, getInteractionContext]);

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const context = getInteractionContext(event);
    
    if (interactionState === 'PANNING') {
        dispatch({ type: 'PANNING', payload: getCoords(event) });
        return;
    }
    
    if (!context) return;

    switch (interactionState) {
        case 'DRAWING': dispatch({ type: 'DRAWING', payload: context.coords }); break;
        case 'MOVING': dispatch({ type: 'MOVING', payload: context.coords }); break;
        case 'RESIZING': dispatch({ type: 'RESIZING', payload: context.coords }); break;
    }
  }, [interactionState, dispatch, getCoords, getInteractionContext]);

  const handlePointerUp = useCallback(() => {
    if (interactionState !== 'IDLE' && interactionState !== 'EDITING_TEXT') {
      dispatch({ type: 'FINISH_INTERACTION' });
    }
  }, [interactionState, dispatch]);

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const { x, y } = getCoords(event);
    dispatch({ type: 'ZOOM', payload: { deltaY: event.deltaY, x, y } });
  }, [dispatch, getCoords]);
  
  const getCursor = () => {
    if (selectedTool === 'HAND') return interactionState === 'PANNING' ? 'grabbing' : 'grab';
    if (interactionState === 'PANNING') return 'grabbing';
    if (isSpacePressed) return 'grab';
    if (selectedTool === 'SELECT') return 'default';
    if (selectedTool === 'TEXT') return 'text';
    return 'crosshair';
  };

  const selectedElementObject = selectedElement ? allElements.find(el => el.id === selectedElement.elementId) : null;
  const handles: { handle: ResizeHandle, x: number, y: number, cursor: string }[] = selectedElementObject ? [
      { handle: 'nw', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'nwse-resize' },
      { handle: 'n', x: selectedElementObject.x + selectedElementObject.width / 2 - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'ns-resize' },
      { handle: 'ne', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y - HANDLE_OFFSET, cursor: 'nesw-resize' },
      { handle: 'e', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
      { handle: 'se', x: selectedElementObject.x + selectedElementObject.width - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'nwse-resize' },
      { handle: 's', x: selectedElementObject.x + selectedElementObject.width / 2 - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'ns-resize' },
      { handle: 'sw', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height - HANDLE_OFFSET, cursor: 'nesw-resize' },
      { handle: 'w', x: selectedElementObject.x - HANDLE_OFFSET, y: selectedElementObject.y + selectedElementObject.height / 2 - HANDLE_OFFSET, cursor: 'ew-resize' },
  ] : [];

  return (
    <div className="w-full h-full bg-gray-300">
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
              {leftPage.elements.map(element => (
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={element.id === selectedElement?.elementId} pageId={leftPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null} />
              ))}
            </g>
          )}

          {rightPage && (
            <g transform={`translate(${A4_WIDTH + PAGE_GAP}, 0)`}>
              <rect x="0" y="0" width={A4_WIDTH} height={A4_HEIGHT} fill="white" filter="url(#shadow)" pointerEvents="none" />
              {rightPage.elements.map(element => (
                <Shape key={element.id} element={element} roughSvg={roughSvg} selectedTool={selectedTool} isSelected={element.id === selectedElement?.elementId} pageId={rightPage.id} onPointerDown={handleShapePointerDown} editingElementId={interactionState === 'EDITING_TEXT' ? currentElementId : null}/>
              ))}
            </g>
          )}

          {selectedElementObject && (
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
                        onPointerDown={(e) => handleResizePointerDown(e, handle)}
                    />
                ))}
            </g>
          )}
        </g>
      </svg>
      {editingElementInfo && (
        <textarea
            ref={textareaRef}
            value={editingText}
            onChange={handleTextChange}
            onBlur={handleTextareaBlur}
            style={{
                position: 'absolute',
                left: `${(editingElementInfo.x + editingElementInfo.pageOffset) * camera.zoom + camera.x}px`,
                top: `${editingElementInfo.y * camera.zoom + camera.y}px`,
                width: `${Math.max(editingElementInfo.width, 50) * camera.zoom}px`,
                height: `${Math.max(editingElementInfo.height, editingElementInfo.fontSize * 1.2) * camera.zoom}px`,
                fontSize: `${editingElementInfo.fontSize * camera.zoom}px`,
                fontFamily: editingElementInfo.fontFamily,
                lineHeight: 1.2,
                color: editingElementInfo.stroke,
                border: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre',
            }}
        />
      )}
    </div>
  );
}
