import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement, FreeDrawElement, CurveElement, LineElement, ArrowElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks } from '../editor.helpers';
import { resizeElement } from '../../../utils/geometry';

export function transformReducer(state: EditorState, action: EditorAction): EditorState {
    const { present } = state.history;

    switch (action.type) {
        case 'START_MOVING': {
            if (!state.selectedElement) return state;
            const { pageId, elementId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            const element = pageResult.page.elements.find(el => el.id === elementId);
            return { ...state, historySnapshot: present, interactionState: 'MOVING', startPoint: action.payload, elementSnapshot: element || null };
        }

        case 'MOVING': {
            if (state.interactionState !== 'MOVING' || !state.startPoint || !state.elementSnapshot || !state.selectedElement) return state;
            const { pageId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;

            const { x: currentX, y: currentY } = action.payload;
            const { x: startX, y: startY } = state.startPoint;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            const updatedElements = pageResult.page.elements.map(el => {
                if (el.id !== state.selectedElement?.elementId) return el;

                const originalElement = state.elementSnapshot!;

                switch (el.type) {
                    case 'RECTANGLE':
                    case 'ELLIPSE':
                    case 'TEXT':
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                        };
                    case 'FREEDRAW':
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                            points: (originalElement as FreeDrawElement).points.map(([px, py]): [number, number] => [px + deltaX, py + deltaY])
                        };
                    case 'CURVE':
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                            points: (originalElement as CurveElement).points.map(([px, py]) => [px + deltaX, py + deltaY]) as [[number, number], [number, number], [number, number]]
                        };
                    case 'LINE':
                    case 'ARROW':
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                            points: (originalElement as LineElement | ArrowElement).points.map(([px, py]) => [px + deltaX, py + deltaY]) as [[number, number], [number, number]]
                        };
                }
            });
            const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements as CanvasElement[] });
            return { ...state, history: { ...state.history, present: newPresent } };
        }

        case 'START_RESIZING': {
            if (!state.selectedElement) return state;
            const { pageId, elementId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            const element = pageResult.page.elements.find(el => el.id === elementId);
            return { ...state, historySnapshot: present, interactionState: 'RESIZING', startPoint: action.payload, resizeHandle: action.payload.handle, elementSnapshot: element || null };
        }

        case 'RESIZING': {
            if (state.interactionState !== 'RESIZING' || !state.startPoint || !state.elementSnapshot || !state.resizeHandle || !state.selectedElement) return state;
            const { pageId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            
            const { x: currentX, y: currentY } = action.payload;
            const { x: startX, y: startY } = state.startPoint;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const resized = resizeElement(state.elementSnapshot, state.resizeHandle, deltaX, deltaY);
            const updatedElements = pageResult.page.elements.map(el => el.id === state.selectedElement?.elementId ? resized : el);
            const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
            return { ...state, history: { ...state.history, present: newPresent } };
        }

        default:
            return state;
    }
}
