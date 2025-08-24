import React, { useCallback } from 'react';
import { ResizeHandle, Tool } from '../../../types/elements';
import { getSVGCoordinates } from '../../../utils/geometry';
import { EditorAction, EditorState, Page } from '../../editor/editor.types';
import { A4_HEIGHT, A4_WIDTH, PAGE_GAP } from '../../../constants';

interface UseCanvasInteractionProps {
  camera: { x: number; y: number; zoom: number };
  dispatch: React.Dispatch<EditorAction>;
  interactionState: EditorState['interactionState'];
  isSpacePressed: boolean;
  leftPage: Page | null;
  rightPage: Page | null;
  selectedElement: { pageId: string, elementId: string } | null;
  selectedIds: { pageId: string; elementIds: string[] } | null;
  selectedTool: Tool;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const useCanvasInteraction = ({
  camera,
  dispatch,
  interactionState,
  isSpacePressed,
  leftPage,
  rightPage,
  selectedElement,
  selectedIds,
  selectedTool,
  svgRef
}: UseCanvasInteractionProps) => {

  const getCoords = useCallback((event: { clientX: number, clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    return getSVGCoordinates(svgRef.current, event);
  }, [svgRef]);

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
  }, [camera.x, camera.y, camera.zoom, leftPage, rightPage, svgRef]);

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
  }, [dispatch, selectedTool, getCoords, getInteractionContext, isSpacePressed, svgRef]);
  
  const handleShapePointerDown = useCallback((event: React.PointerEvent, elementId: string, pageId: string) => {
    event.stopPropagation();
    
    const page = pageId === leftPage?.id ? leftPage : (pageId === rightPage?.id ? rightPage : null);
    const element = page?.elements.find(el => el.id === elementId);

    if (element?.type === 'TEXT') {
      if (event.detail === 2 || selectedTool === 'TEXT') {
         dispatch({ type: 'START_EDITING_TEXT', payload: { elementId, pageId } });
         return;
      }
    }

    if (event.detail === 2 && element) {
      if (element.type === 'RECTANGLE' || element.type === 'ELLIPSE') {
        dispatch({ type: 'CREATE_BOUND_TEXT', payload: { pageId, containerId: elementId } });
        return;
      }
      if (element.type === 'LINE' || element.type === 'ARROW') {
        dispatch({ type: 'CREATE_EDGE_LABEL', payload: { pageId, edgeId: elementId } });
        return;
      }
    }

    if (selectedTool === 'SELECT') {
       if (event.shiftKey) {
         dispatch({ type: 'TOGGLE_ELEMENT_IN_SELECTION', payload: { pageId, elementId } });
         return;
       }

       const context = getInteractionContext(event);
       if (!context) return;
       
       const inMultiSelection = !!(selectedIds && selectedIds.pageId === pageId && selectedIds.elementIds.includes(elementId));

       if (inMultiSelection || selectedElement?.elementId === elementId) {
           dispatch({ type: 'START_MOVING', payload: context.coords });
       } else {
           dispatch({ type: 'SELECT_ELEMENT', payload: { elementId, pageId } });
       }
    }
  }, [dispatch, selectedTool, getInteractionContext, selectedElement, selectedIds, leftPage, rightPage]);

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

  return {
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleWheel,
      handleShapePointerDown,
      handleResizePointerDown,
      getCursor,
  };
};