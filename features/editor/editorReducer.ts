

import { CanvasElement, CurveElement, FreeDrawElement, ResizeHandle, Tool, LineElement, ArrowElement, FillStyle, StrokeStyle, Roundness, TextElement } from '../../types/elements';
import { generateId } from '../../utils/id';
import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_STROKE_STYLE, DEFAULT_ROUNDNESS, DEFAULT_FILL_STYLE, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY } from '../../constants';
import { resizeElement } from '../../utils/geometry';

export interface Page {
  id: string;
  name: string;
  elements: CanvasElement[];
}

export interface Notebook {
  id: string;
  name: string;
  pages: Page[];
}

export interface EditorState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  activePageId: string | null;
  selectedTool: Tool;
  interactionState: 'IDLE' | 'DRAWING' | 'MOVING' | 'RESIZING' | 'PANNING' | 'EDITING_TEXT';
  currentElementId: string | null;
  startPoint: { x: number; y: number } | null;
  selectedElement: { pageId: string, elementId: string } | null;
  elementSnapshot: CanvasElement | null;
  resizeHandle: ResizeHandle | null;
  camera: { x: number; y: number; zoom: number };
  cameraSnapshot: { x: number; y: number; } | null;
  currentStyle: {
    stroke: string;
    fill: string;
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roundness: Roundness;
    fontSize: number;
    fontFamily: string;
  };
}

export type EditorAction =
  | { type: 'ADD_NOTEBOOK' }
  | { type: 'ADD_PAGE'; payload: { notebookId: string } }
  | { type: 'SELECT_PAGE'; payload: { notebookId: string; pageId: string } }
  | { type: 'RENAME_NOTEBOOK'; payload: { notebookId: string, newName: string } }
  | { type: 'RENAME_PAGE'; payload: { pageId: string, newName: string } }
  | { type: 'SELECT_TOOL'; payload: Tool }
  | { type: 'START_DRAWING'; payload: { x: number; y: number; pageId: string } }
  | { type: 'DRAWING'; payload: { x: number; y: number } }
  | { type: 'START_MOVING'; payload: { x: number; y: number } }
  | { type: 'MOVING'; payload: { x: number; y: number } }
  | { type: 'START_RESIZING'; payload: { x: number; y: number; handle: ResizeHandle } }
  | { type: 'RESIZING'; payload: { x: number; y: number } }
  | { type: 'START_PANNING'; payload: { x: number; y: number } }
  | { type: 'PANNING'; payload: { x: number; y: number } }
  | { type: 'ZOOM'; payload: { x: number; y: number; deltaY: number } }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET_ZOOM' }
  | { type: 'FINISH_INTERACTION' }
  | { type: 'SELECT_ELEMENT'; payload: { pageId: string, elementId: string } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'DELETE_SELECTED_ELEMENT' }
  | { type: 'START_EDITING_TEXT'; payload: { pageId: string, elementId: string } }
  | { type: 'EDIT_ELEMENT_TEXT'; payload: { text: string; width: number; height: number } }
  | { type: 'UPDATE_ELEMENT_PROPERTIES'; payload: { properties: Partial<CanvasElement> } };

const initialPageId = generateId();
const initialNotebookId = generateId();

export const initialState: EditorState = {
  notebooks: [
    {
      id: initialNotebookId,
      name: 'My First Notebook',
      pages: [
        {
          id: initialPageId,
          name: 'Page 1',
          elements: [],
        },
      ],
    },
  ],
  activeNotebookId: initialNotebookId,
  activePageId: initialPageId,
  selectedTool: 'SELECT',
  interactionState: 'IDLE',
  currentElementId: null,
  startPoint: null,
  selectedElement: null,
  elementSnapshot: null,
  resizeHandle: null,
  camera: { x: 50, y: 50, zoom: 0.8 },
  cameraSnapshot: null,
  currentStyle: {
    stroke: DEFAULT_STROKE_COLOR,
    fill: DEFAULT_FILL_COLOR,
    fillStyle: DEFAULT_FILL_STYLE,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    strokeStyle: DEFAULT_STROKE_STYLE,
    roundness: DEFAULT_ROUNDNESS,
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
};

const findPage = (state: EditorState, pageId: string): { notebook: Notebook; page: Page } | null => {
  for (const notebook of state.notebooks) {
    const page = notebook.pages.find(p => p.id === pageId);
    if (page) return { notebook, page };
  }
  return null;
}

const updatePageInState = (state: EditorState, pageId: string, updatedPage: Page): EditorState => {
  return {
    ...state,
    notebooks: state.notebooks.map(notebook => ({
      ...notebook,
      pages: notebook.pages.map(page => (page.id === pageId ? updatedPage : page)),
    })),
  };
}


const createElement = (tool: Tool, id: string, x: number, y: number, style: EditorState['currentStyle']): CanvasElement | null => {
    const baseProperties = {
        seed: Math.random() * 1_000_000,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeStyle: style.strokeStyle,
    };

    switch (tool) {
        case 'RECTANGLE': return { id, x, y, width: 0, height: 0, type: 'RECTANGLE', ...baseProperties, fill: style.fill, fillStyle: style.fillStyle, roundness: style.roundness };
        case 'ELLIPSE': return { id, x, y, width: 0, height: 0, type: 'ELLIPSE', ...baseProperties, fill: style.fill, fillStyle: style.fillStyle };
        case 'LINE': return { id, x, y, width: 0, height: 0, type: 'LINE', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y]] };
        case 'ARROW': return { id, x, y, width: 0, height: 0, type: 'ARROW', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y]] };
        case 'FREEDRAW': return { id, x, y, width: 0, height: 0, type: 'FREEDRAW', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y]] };
        case 'CURVE': return { id, x, y, width: 0, height: 0, type: 'CURVE', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y], [x, y]] };
        case 'TEXT': return { id, x, y, width: 0, height: 0, type: 'TEXT', text: '', ...baseProperties, stroke: style.stroke, fill: 'transparent', fillStyle: 'solid', strokeWidth: 0, strokeStyle: 'solid', fontSize: style.fontSize, fontFamily: style.fontFamily };
        default: return null;
    }
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  
  switch (action.type) {
    case 'ADD_NOTEBOOK': {
        const newPageId = generateId();
        const newNotebookId = generateId();
        const newNotebook: Notebook = {
            id: newNotebookId,
            name: `Notebook ${state.notebooks.length + 1}`,
            pages: [{ id: newPageId, name: 'Page 1', elements: [] }],
        };
        return {
            ...state,
            notebooks: [...state.notebooks, newNotebook],
            activeNotebookId: newNotebookId,
            activePageId: newPageId,
            selectedElement: null,
        };
    }

    case 'ADD_PAGE': {
        const { notebookId } = action.payload;
        const notebook = state.notebooks.find(n => n.id === notebookId);
        if (!notebook) return state;

        const newPageId = generateId();
        const newPage: Page = {
            id: newPageId,
            name: `Page ${notebook.pages.length + 1}`,
            elements: [],
        };

        return {
            ...state,
            notebooks: state.notebooks.map(n =>
                n.id === notebookId ? { ...n, pages: [...n.pages, newPage] } : n
            ),
            activeNotebookId: notebookId,
            activePageId: newPageId,
            selectedElement: null,
        };
    }

    case 'SELECT_PAGE': {
        if (state.activePageId === action.payload.pageId) return state;
        return {
            ...state,
            activeNotebookId: action.payload.notebookId,
            activePageId: action.payload.pageId,
            selectedElement: null,
            interactionState: 'IDLE',
        };
    }
    
    case 'RENAME_NOTEBOOK': {
        return {
            ...state,
            notebooks: state.notebooks.map(n =>
                n.id === action.payload.notebookId ? { ...n, name: action.payload.newName } : n
            ),
        };
    }

    case 'RENAME_PAGE': {
        return {
            ...state,
            notebooks: state.notebooks.map(notebook => ({
                ...notebook,
                pages: notebook.pages.map(page => 
                    page.id === action.payload.pageId ? { ...page, name: action.payload.newName } : page
                ),
            })),
        };
    }

    case 'SELECT_TOOL':
      return { ...state, selectedTool: action.payload, selectedElement: null };
    
    case 'SELECT_ELEMENT': {
      const { pageId, elementId } = action.payload;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;
      
      const selectedElement = pageResult.page.elements.find(el => el.id === elementId);
      if (!selectedElement) return state;
      
      const newCurrentStyle = { ...state.currentStyle };
      if('stroke' in selectedElement) newCurrentStyle.stroke = selectedElement.stroke;
      if('strokeWidth' in selectedElement) newCurrentStyle.strokeWidth = selectedElement.strokeWidth;
      if('strokeStyle' in selectedElement) newCurrentStyle.strokeStyle = selectedElement.strokeStyle;
      if('fill' in selectedElement) newCurrentStyle.fill = selectedElement.fill;
      if('fillStyle' in selectedElement) newCurrentStyle.fillStyle = selectedElement.fillStyle;
      if(selectedElement.type === 'RECTANGLE') newCurrentStyle.roundness = selectedElement.roundness;
      if(selectedElement.type === 'TEXT') {
        newCurrentStyle.fontSize = selectedElement.fontSize;
        newCurrentStyle.fontFamily = selectedElement.fontFamily;
      }

      return { ...state, selectedElement: action.payload, selectedTool: 'SELECT', currentStyle: newCurrentStyle };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedElement: null };

    case 'DELETE_SELECTED_ELEMENT': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;
      
      const updatedPage = { ...pageResult.page, elements: pageResult.page.elements.filter(el => el.id !== elementId) };
      return { ...updatePageInState(state, pageId, updatedPage), selectedElement: null };
    }
    
    case 'UPDATE_ELEMENT_PROPERTIES': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;

      const updatedPage = {
        ...pageResult.page,
        elements: pageResult.page.elements.map(el => el.id === elementId ? { ...el, ...action.payload.properties } : el)
      };
      return { ...updatePageInState(state, pageId, updatedPage), currentStyle: { ...state.currentStyle, ...action.payload.properties } };
    }

    case 'START_DRAWING': {
        const { x, y, pageId } = action.payload;
        const pageResult = findPage(state, pageId);
        if (!pageResult) return state;

        const newElementId = generateId();
        const newElement = createElement(state.selectedTool, newElementId, x, y, state.currentStyle);
        if (!newElement) return state;

        const updatedPage = { ...pageResult.page, elements: [...pageResult.page.elements, newElement] };

        if (state.selectedTool === 'TEXT') {
            return {
                ...updatePageInState(state, pageId, updatedPage),
                interactionState: 'EDITING_TEXT',
                currentElementId: newElementId,
                selectedElement: { pageId, elementId: newElementId },
            };
        }

        return {
            ...updatePageInState(state, pageId, updatedPage),
            interactionState: 'DRAWING',
            currentElementId: newElementId,
            startPoint: { x, y },
            selectedElement: null,
        };
    }

    case 'DRAWING': {
      if (state.interactionState !== 'DRAWING' || !state.startPoint || !state.currentElementId) return state;
      
      let pageResult: { notebook: Notebook; page: Page } | null = null;
      if (state.currentElementId) {
        for (const notebook of state.notebooks) {
          const page = notebook.pages.find(p => p.elements.some(el => el.id === state.currentElementId));
          if (page) {
            pageResult = { notebook, page };
            break;
          }
        }
      }

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
      return updatePageInState(state, pageResult.page.id, updatedPage);
    }

    case 'START_MOVING': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;
      const element = pageResult.page.elements.find(el => el.id === elementId);
      return { ...state, interactionState: 'MOVING', startPoint: action.payload, elementSnapshot: element || null };
    }

    case 'MOVING': {
      if (state.interactionState !== 'MOVING' || !state.startPoint || !state.elementSnapshot || !state.selectedElement) return state;
      const { pageId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;

      const { x: currentX, y: currentY } = action.payload;
      const { x: startX, y: startY } = state.startPoint;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const updatedElements = pageResult.page.elements.map(el => {
        if (el.id !== state.selectedElement?.elementId) return el;
        const originalElement = state.elementSnapshot!; const newElement = { ...originalElement };
        newElement.x = originalElement.x + deltaX; newElement.y = originalElement.y + deltaY;
        if (newElement.type === 'FREEDRAW') { newElement.points = (originalElement as FreeDrawElement).points.map(([px, py]) => [px + deltaX, py + deltaY]) as [number, number][]; }
        else if (newElement.type === 'CURVE') { newElement.points = (originalElement as CurveElement).points.map(([px, py]) => [px + deltaX, py + deltaY]) as [[number,number],[number,number],[number,number]]; }
        else if (newElement.type === 'LINE' || newElement.type === 'ARROW') { newElement.points = (originalElement as LineElement | ArrowElement).points.map(([px, py]) => [px + deltaX, py + deltaY]) as [[number,number],[number,number]]; }
        return newElement;
      });
      return updatePageInState(state, pageId, { ...pageResult.page, elements: updatedElements });
    }

    case 'START_RESIZING': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;
      const element = pageResult.page.elements.find(el => el.id === elementId);
      return { ...state, interactionState: 'RESIZING', startPoint: action.payload, resizeHandle: action.payload.handle, elementSnapshot: element || null };
    }

    case 'RESIZING': {
      if (state.interactionState !== 'RESIZING' || !state.startPoint || !state.elementSnapshot || !state.resizeHandle || !state.selectedElement) return state;
      const { pageId } = state.selectedElement;
      const pageResult = findPage(state, pageId);
      if (!pageResult) return state;
      
      const { x: currentX, y: currentY } = action.payload;
      const { x: startX, y: startY } = state.startPoint;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const resized = resizeElement(state.elementSnapshot, state.resizeHandle, deltaX, deltaY);
      const updatedElements = pageResult.page.elements.map(el => el.id === state.selectedElement?.elementId ? resized : el);
      return updatePageInState(state, pageId, { ...pageResult.page, elements: updatedElements });
    }
    
    case 'START_PANNING': return { ...state, interactionState: 'PANNING', startPoint: action.payload, cameraSnapshot: { x: state.camera.x, y: state.camera.y } };
    case 'PANNING': {
      if (state.interactionState !== 'PANNING' || !state.startPoint || !state.cameraSnapshot) return state;
      const { x: currentX, y: currentY } = action.payload;
      const { x: startX, y: startY } = state.startPoint;
      return { ...state, camera: { ...state.camera, x: state.cameraSnapshot.x + (currentX - startX), y: state.cameraSnapshot.y + (currentY - startY) } };
    }
    case 'ZOOM': {
      const { x, y, deltaY } = action.payload;
      const { camera } = state;
      const zoomFactor = 1 - deltaY * 0.005;
      const newZoom = Math.max(0.1, Math.min(5.0, camera.zoom * zoomFactor));
      const worldX = (x - camera.x) / camera.zoom;
      const worldY = (y - camera.y) / camera.zoom;
      return { ...state, camera: { x: x - worldX * newZoom, y: y - worldY * newZoom, zoom: newZoom } };
    }
    case 'ZOOM_IN': return { ...state, camera: { ...state.camera, zoom: Math.min(5.0, state.camera.zoom * 1.1) } };
    case 'ZOOM_OUT': return { ...state, camera: { ...state.camera, zoom: Math.max(0.1, state.camera.zoom / 1.1) } };
    case 'RESET_ZOOM': return { ...state, camera: { x: 50, y: 50, zoom: 0.8 } };
    case 'START_EDITING_TEXT': {
        const { pageId, elementId } = action.payload;
        const pageResult = findPage(state, pageId);
        if (!pageResult) return state;
        const element = pageResult.page.elements.find(el => el.id === elementId);
        if (!element || element.type !== 'TEXT') return state;
        return { ...state, interactionState: 'EDITING_TEXT', currentElementId: elementId, selectedElement: action.payload, selectedTool: 'SELECT' };
    }
    case 'EDIT_ELEMENT_TEXT': {
        if (state.interactionState !== 'EDITING_TEXT' || !state.currentElementId || !state.selectedElement) return state;
        const { pageId } = state.selectedElement;
        const pageResult = findPage(state, pageId);
        if (!pageResult) return state;

        const { text, width, height } = action.payload;
        const updatedElements = pageResult.page.elements.map(el => el.id === state.currentElementId ? { ...el, text, width, height } as TextElement : el);
        return updatePageInState(state, pageId, { ...pageResult.page, elements: updatedElements });
    }
    case 'FINISH_INTERACTION': {
      if (state.interactionState === 'EDITING_TEXT' && state.currentElementId && state.selectedElement) {
          const { pageId } = state.selectedElement;
          const pageResult = findPage(state, pageId);
          if (pageResult) {
            const element = pageResult.page.elements.find(el => el.id === state.currentElementId);
            if (element && element.type === 'TEXT' && element.text.trim() === '') {
                const updatedPage = { ...pageResult.page, elements: pageResult.page.elements.filter(el => el.id !== state.currentElementId) };
                return { ...updatePageInState(state, pageId, updatedPage), interactionState: 'IDLE', currentElementId: null, selectedElement: null };
            }
          }
          return { ...state, interactionState: 'IDLE', currentElementId: null, selectedTool: 'SELECT' };
      }
      return { ...state, interactionState: 'IDLE', currentElementId: null, startPoint: null, elementSnapshot: null, resizeHandle: null, cameraSnapshot: null };
    }
    default: return state;
  }
}