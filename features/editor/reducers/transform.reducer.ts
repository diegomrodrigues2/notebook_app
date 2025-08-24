import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement, FreeDrawElement, CurveElement, LineElement, ArrowElement, TextElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks } from '../editor.helpers';
import { resizeElement } from '../../../utils/geometry';
import { measureText } from '../../../utils/text';

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

            let updatedElements = pageResult.page.elements.map(el => {
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

            // Move bound/attached texts by delta as well
            const moved = updatedElements.find(el => el.id === state.selectedElement?.elementId)!;
            const withTexts = updatedElements.map(el => {
              if (el.type === 'TEXT' && (el as TextElement).containerId === moved.id) {
                return { ...el, x: el.x + deltaX, y: el.y + deltaY };
              }
              if (el.type === 'TEXT' && (el as TextElement).attachedToId === moved.id) {
                return { ...el, x: el.x + deltaX, y: el.y + deltaY };
              }
              return el;
            });
            
            const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: withTexts as CanvasElement[] });
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

            const snap = state.elementSnapshot;
            const resized = resizeElement(snap, state.resizeHandle, deltaX, deltaY);

            // Special case for resizing a TEXT element: always scale the font.
            if (resized.type === 'TEXT') {
                const originalTe = snap as TextElement;
                const resizedTe = resized as TextElement;
                
                const w0 = Math.max(1, originalTe.width);
                const h0 = Math.max(1, originalTe.height);
                const w1 = Math.max(1, resizedTe.width);
                const h1 = Math.max(1, resizedTe.height);

                const scaleX = w0 > 0 ? w1 / w0 : 1;
                const scaleY = h0 > 0 ? h1 / h0 : 1;
                
                const sf = Math.max(0.1, Math.sqrt(scaleX * scaleY));

                if (isFinite(sf) && sf > 0) {
                    const newFontSize = Math.max(4, originalTe.fontSize * sf);
                    const newWidth = Math.max(10, resizedTe.width);
                    const m = measureText(originalTe.text, newFontSize, originalTe.fontFamily, newWidth);
                    
                    const finalTe: TextElement = {
                        ...resizedTe,
                        fontSize: newFontSize,
                        width: newWidth,
                        height: m.height,
                        wrap: true, // Force wrap on resize for predictable behavior
                    };
                    
                    const updatedElements = pageResult.page.elements.map(el => el.id === state.selectedElement?.elementId ? finalTe : el);
                    const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
                    return { ...state, history: { ...state.history, present: newPresent } };
                }
                return state; // Avoid update if scale factor is invalid
            }

            let updatedElements = pageResult.page.elements.map(el => {
                if (el.id === state.selectedElement?.elementId) return resized;
                return el;
            });

            // If container resized → recenter bound text
            if (resized.type === 'RECTANGLE' || resized.type === 'ELLIPSE') {
                updatedElements = updatedElements.map(el => {
                    if (el.type === 'TEXT' && (el as TextElement).containerId === resized.id) {
                        return {
                            ...el,
                            x: resized.x + (resized.width - el.width) / 2,
                            y: resized.y + (resized.height - el.height) / 2,
                        };
                    }
                    return el;
                });
            }

            // If edge resized → snap label to new midpoint
            if (resized.type === 'LINE' || resized.type === 'ARROW') {
                const [a, b] = (resized as LineElement | ArrowElement).points;
                const mx = (a[0] + b[0]) / 2;
                const my = (a[1] + b[1]) / 2;
                updatedElements = updatedElements.map(el => {
                    if (el.type === 'TEXT' && (el as TextElement).attachedToId === resized.id) {
                        return { ...el, x: mx - el.width / 2, y: my - el.height / 2 };
                    }
                    return el;
                });
            }

            const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
            return { ...state, history: { ...state.history, present: newPresent } };
        }

        default:
            return state;
    }
}