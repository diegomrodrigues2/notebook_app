import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks } from '../editor.helpers';
import { createElement } from '../../elements/element.utils';
import { generateId } from '../../../utils/id';

export function drawingReducer(state: EditorState, action: EditorAction): EditorState {
    const { present } = state.history;

    switch (action.type) {
        case 'START_DRAWING': {
            const { x, y, pageId } = action.payload;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;

            const maxZIndex = pageResult.page.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
            
            const newElementId = generateId();
            const newElement = createElement(state.selectedTool, newElementId, x, y, state.currentStyle);
            if (!newElement) return state;

            newElement.zIndex = maxZIndex + 1;

            const updatedPage = { ...pageResult.page, elements: [...pageResult.page.elements, newElement] };
            const newPresent = updatePageInNotebooks(present, pageId, updatedPage);

            if (state.selectedTool === 'TEXT') {
                return {
                    ...state,
                    history: { ...state.history, present: newPresent },
                    historySnapshot: present,
                    interactionState: 'EDITING_TEXT',
                    currentElementId: newElementId,
                    selectedElement: { pageId, elementId: newElementId },
                };
            }

            return {
                ...state,
                history: { ...state.history, present: newPresent },
                historySnapshot: present,
                interactionState: 'DRAWING',
                currentElementId: newElementId,
                startPoint: { x, y },
                selectedElement: null,
            };
        }

        case 'DRAWING': {
          if (state.interactionState !== 'DRAWING' || !state.startPoint || !state.currentElementId) return state;
          
          const pageResult = findPage(present, state.activePageId!);
          if (!pageResult) return state;

          const { x: currentX, y: currentY } = action.payload;
          const { x: startX, y: startY } = state.startPoint;
          
          const updatedElements = pageResult.page.elements.map((el) => {
            if (el.id !== state.currentElementId) return el;
            switch (el.type) {
              case 'FREEDRAW': { const newPoints = [...el.points, [currentX, currentY] as [number, number]]; const allX = newPoints.map(p => p[0]); const allY = newPoints.map(p => p[1]); const minX = Math.min(...allX); const minY = Math.min(...allY); const maxX = Math.max(...allX); const maxY = Math.max(...allY); return { ...el, points: newPoints, x: minX, y: minY, width: maxX - minX, height: maxY - minY }; }
              case 'CURVE': { const startPoint: [number, number] = [startX, startY]; const endPoint: [number, number] = [currentX, currentY]; const midX = (startX + currentX) / 2; const midY = (startY + currentY) / 2; const dx = currentX - startX; const dy = currentY - startY; const controlPoint: [number, number] = [midX - dy * 0.5, midY + dx * 0.5]; const allPoints: [number, number][] = [startPoint, controlPoint, endPoint]; const allX = allPoints.map(p => p[0]); const allY = allPoints.map(p => p[1]); const minX = Math.min(...allX); const minY = Math.min(...allY); const maxX = Math.max(...allX); const maxY = Math.max(...allY); return { ...el, points: [startPoint, controlPoint, endPoint], x: minX, y: minY, width: maxX - minX, height: maxY - minY }; }
              case 'LINE': case 'ARROW': { const newPoints: [[number, number], [number, number]] = [[startX, startY], [currentX, currentY]]; const allX = newPoints.map(p => p[0]); const allY = newPoints.map(p => p[1]); const minX = Math.min(...allX); const minY = Math.min(...allY); const maxX = Math.max(...allX); const maxY = Math.max(...allY); return { ...el, points: newPoints, x: minX, y: minY, width: maxX - minX, height: maxY - minY }; }
              case 'RECTANGLE': case 'ELLIPSE': { const newWidth = currentX - startX; const newHeight = currentY - startY; return { ...el, x: newWidth > 0 ? startX : currentX, y: newHeight > 0 ? startY : currentY, width: Math.abs(newWidth), height: Math.abs(newHeight) }; }
              default: return el;
            }
          });
          const updatedPage = { ...pageResult.page, elements: updatedElements as CanvasElement[] };
          const newPresent = updatePageInNotebooks(present, pageResult.page.id, updatedPage);
          return { ...state, history: { ...state.history, present: newPresent } };
        }
        
        default:
            return state;
    }
}
