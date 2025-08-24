import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement, FreeDrawElement, CurveElement, LineElement, ArrowElement, TextElement, ResizeHandle } from '../../../types/elements';
import { findPage, updatePageInNotebooks } from '../editor.helpers';
import { resizeElement } from '../../../utils/geometry';
import { measureText } from '../../../utils/text';

function bbox(elements: CanvasElement[]) {
  const minX = Math.min(...elements.map(e => e.x));
  const minY = Math.min(...elements.map(e => e.y));
  const maxX = Math.max(...elements.map(e => e.x + e.width));
  const maxY = Math.max(...elements.map(e => e.y + e.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function scalePoint(px: number, py: number, from: {x:number;y:number;width:number;height:number}, to: {x:number;y:number;width:number;height:number}) {
  const sx = from.width === 0 ? 1 : (px - from.x) / from.width;
  const sy = from.height === 0 ? 1 : (py - from.y) / from.height;
  return [to.x + sx * to.width, to.y + sy * to.height] as [number, number];
}

function scaleElementByGroup(el: CanvasElement, from: {x:number;y:number;width:number;height:number}, to: {x:number;y:number;width:number;height:number}): CanvasElement {
  const sx = from.width  === 0 ? 1 : to.width  / from.width;
  const sy = from.height === 0 ? 1 : to.height / from.height;

  switch (el.type) {
    case 'RECTANGLE':
    case 'ELLIPSE': {
      const [nx, ny] = scalePoint(el.x, el.y, from, to);
      return { ...el, x: nx, y: ny, width: Math.max(0, el.width * sx), height: Math.max(0, el.height * sy) };
    }
    case 'LINE':
    case 'ARROW': {
      const pts = (el as LineElement | ArrowElement).points.map(([x,y]) => scalePoint(x, y, from, to)) as [[number,number],[number,number]];
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys);
      return { ...el, points: pts, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'CURVE': {
      const pts = (el as CurveElement).points.map(([x,y]) => scalePoint(x, y, from, to)) as [[number,number],[number,number],[number,number]];
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys);
      return { ...el, points: pts, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'FREEDRAW': {
      const pts = (el as FreeDrawElement).points.map(([x,y]) => scalePoint(x, y, from, to));
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys);
      return { ...el, points: pts, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'TEXT': {
      const [nx, ny] = scalePoint(el.x, el.y, from, to);
      const w = Math.max(10, el.width * sx);
      const sf = Math.max(0.1, Math.sqrt(Math.max(0.0001, sx * sy)));
      const newFont = Math.max(4, (el as TextElement).fontSize * sf);
      const m = measureText((el as TextElement).text, newFont, (el as TextElement).fontFamily, w);
      return { ...(el as TextElement), x: nx, y: ny, width: w, height: m.height, fontSize: newFont, wrap: true };
    }
  }
}

function resizeGroupRect(from: {x:number;y:number;width:number;height:number}, handle: ResizeHandle, dx: number, dy: number) {
  let { x, y, width, height } = from;
  switch (handle) {
    case 'nw': x += dx; y += dy; width -= dx; height -= dy; break;
    case 'n':  y += dy; height -= dy; break;
    case 'ne': y += dy; width += dx; height -= dy; break;
    case 'e':  width += dx; break;
    case 'se': width += dx; height += dy; break;
    case 's':  height += dy; break;
    case 'sw': x += dx; width -= dx; height += dy; break;
    case 'w':  x += dx; width -= dx; break;
  }
  if (width < 0) { x += width; width *= -1; }
  if (height < 0){ y += height; height *= -1; }
  return { x, y, width, height };
}

export function transformReducer(state: EditorState, action: EditorAction): EditorState {
    const { present } = state.history;

    switch (action.type) {
        case 'START_MOVING': {
            if (state.selectedIds && state.selectedIds.elementIds.length > 1) {
                const { pageId, elementIds } = state.selectedIds;
                const pageResult = findPage(present, pageId);
                if (!pageResult) return state;
                const originals = pageResult.page.elements.filter(el => elementIds.includes(el.id));
                return {
                    ...state,
                    historySnapshot: present,
                    interactionState: 'MOVING',
                    startPoint: action.payload,
                    elementSnapshot: null,
                    groupSnapshot: { pageId, elements: originals, bounds: bbox(originals) },
                };
            }

            if (!state.selectedElement) return state;
            const { pageId, elementId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            const element = pageResult.page.elements.find(el => el.id === elementId);
            return { ...state, historySnapshot: present, interactionState: 'MOVING', startPoint: action.payload, elementSnapshot: element || null };
        }

        case 'MOVING': {
            if (!state.startPoint) return state;
            const { x: currentX, y: currentY } = action.payload;
            const { x: startX, y: startY } = state.startPoint;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            if (state.groupSnapshot && state.selectedIds) {
                const { pageId, elements: originals } = state.groupSnapshot;
                const pageResult = findPage(present, pageId);
                if (!pageResult) return state;
                const selectedSet = new Set(state.selectedIds.elementIds);
        
                const movedMap = new Map(originals.map(o => [o.id, o]));
                let updatedElements = pageResult.page.elements.map(el => {
                  if (!selectedSet.has(el.id)) return el;
                  const orig = movedMap.get(el.id)!;
                  switch (orig.type) {
                    case 'RECTANGLE': case 'ELLIPSE': case 'TEXT':
                      return { ...orig, x: orig.x + deltaX, y: orig.y + deltaY };
                    case 'FREEDRAW':
                      return { ...orig, x: orig.x + deltaX, y: orig.y + deltaY, points: (orig as FreeDrawElement).points.map(([px,py]) => [px + deltaX, py + deltaY]) as [number, number][] };
                    case 'CURVE': {
                        const originalPoints = (orig as CurveElement).points;
                        const newPoints: [[number, number], [number, number], [number, number]] = [
                            [originalPoints[0][0] + deltaX, originalPoints[0][1] + deltaY],
                            [originalPoints[1][0] + deltaX, originalPoints[1][1] + deltaY],
                            [originalPoints[2][0] + deltaX, originalPoints[2][1] + deltaY]
                        ];
                        return { ...orig, x: orig.x + deltaX, y: orig.y + deltaY, points: newPoints };
                    }
                    case 'LINE': case 'ARROW': {
                        const originalPoints = (orig as LineElement | ArrowElement).points;
                        const newPoints: [[number, number], [number, number]] = [
                            [originalPoints[0][0] + deltaX, originalPoints[0][1] + deltaY],
                            [originalPoints[1][0] + deltaX, originalPoints[1][1] + deltaY]
                        ];
                        return { ...orig, x: orig.x + deltaX, y: orig.y + deltaY, points: newPoints };
                    }
                  }
                  return el;
                });
        
                const movedIdSet = new Set(originals.map(o => o.id));
                updatedElements = updatedElements.map(el => {
                  if (el.type === 'TEXT') {
                    const te = el as TextElement;
                    const boundTo = te.containerId ?? te.attachedToId;
                    if (boundTo && movedIdSet.has(boundTo) && !selectedSet.has(el.id)) {
                      return { ...te, x: te.x + deltaX, y: te.y + deltaY };
                    }
                  }
                  return el;
                });
        
                const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements as CanvasElement[] });
                return { ...state, history: { ...state.history, present: newPresent } };
            }

            if (state.interactionState !== 'MOVING' || !state.elementSnapshot || !state.selectedElement) return state;
            const { pageId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;

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
                    case 'CURVE': {
                        const originalPoints = (originalElement as CurveElement).points;
                        const newPoints: [[number, number], [number, number], [number, number]] = [
                            [originalPoints[0][0] + deltaX, originalPoints[0][1] + deltaY],
                            [originalPoints[1][0] + deltaX, originalPoints[1][1] + deltaY],
                            [originalPoints[2][0] + deltaX, originalPoints[2][1] + deltaY]
                        ];
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                            points: newPoints
                        };
                    }
                    case 'LINE':
                    case 'ARROW': {
                        const originalPoints = (originalElement as LineElement | ArrowElement).points;
                        const newPoints: [[number, number], [number, number]] = [
                            [originalPoints[0][0] + deltaX, originalPoints[0][1] + deltaY],
                            [originalPoints[1][0] + deltaX, originalPoints[1][1] + deltaY]
                        ];
                        return {
                            ...el,
                            x: originalElement.x + deltaX,
                            y: originalElement.y + deltaY,
                            points: newPoints
                        };
                    }
                }
            });
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
            if (state.selectedIds && state.selectedIds.elementIds.length > 1) {
                const { pageId, elementIds } = state.selectedIds;
                const pageResult = findPage(present, pageId);
                if (!pageResult) return state;
                const originals = pageResult.page.elements.filter(el => elementIds.includes(el.id));
                return {
                    ...state,
                    historySnapshot: present,
                    interactionState: 'RESIZING',
                    startPoint: action.payload,
                    resizeHandle: action.payload.handle,
                    elementSnapshot: null,
                    groupSnapshot: { pageId, elements: originals, bounds: bbox(originals) },
                };
            }

            if (!state.selectedElement) return state;
            const { pageId, elementId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            const element = pageResult.page.elements.find(el => el.id === elementId);
            return { ...state, historySnapshot: present, interactionState: 'RESIZING', startPoint: action.payload, resizeHandle: action.payload.handle, elementSnapshot: element || null };
        }

        case 'RESIZING': {
            if (!state.startPoint || !state.resizeHandle) return state;
            const { x: currentX, y: currentY } = action.payload;
            const { x: startX, y: startY } = state.startPoint;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            if (state.groupSnapshot && state.selectedIds) {
                const { pageId, elements: originals, bounds: from } = state.groupSnapshot;
                const pageResult = findPage(present, pageId);
                if (!pageResult) return state;
        
                const to = resizeGroupRect(from, state.resizeHandle, deltaX, deltaY);
                const selectedSet = new Set(state.selectedIds.elementIds);
                const origMap = new Map(originals.map(o => [o.id, o]));
        
                const updatedElements = pageResult.page.elements.map(el => {
                  if (!selectedSet.has(el.id)) return el;
                  const orig = origMap.get(el.id)!;
                  return scaleElementByGroup(orig, from, to);
                });
        
                const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
                return { ...state, history: { ...state.history, present: newPresent } };
            }

            if (state.interactionState !== 'RESIZING' || !state.elementSnapshot || !state.selectedElement) return state;
            const { pageId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            
            const snap = state.elementSnapshot;
            const resized = resizeElement(snap, state.resizeHandle, deltaX, deltaY);

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
                    const finalTe: TextElement = { ...resizedTe, fontSize: newFontSize, width: newWidth, height: m.height, wrap: true };
                    const updatedElements = pageResult.page.elements.map(el => el.id === state.selectedElement?.elementId ? finalTe : el);
                    const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
                    return { ...state, history: { ...state.history, present: newPresent } };
                }
                return state;
            }

            let updatedElements = pageResult.page.elements.map(el => {
                if (el.id === state.selectedElement?.elementId) return resized;
                return el;
            });
            if (resized.type === 'RECTANGLE' || resized.type === 'ELLIPSE') {
                updatedElements = updatedElements.map(el => {
                    if (el.type === 'TEXT' && (el as TextElement).containerId === resized.id) {
                        return { ...el, x: resized.x + (resized.width - el.width) / 2, y: resized.y + (resized.height - el.height) / 2 };
                    }
                    return el;
                });
            }
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