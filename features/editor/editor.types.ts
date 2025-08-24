import { CanvasElement, FillStyle, ResizeHandle, Roundness, StrokeStyle, Tool } from '../../types/elements';

export interface Page {
  id: string;
  name: string;
  elements: CanvasElement[];
}

export interface Notebook {
  id:string;
  name: string;
  pages: Page[];
}

export type Template = 'BLANK' | 'CORNELL' | 'TEXTBOOK' | 'OUTLINING' | 'SENTENCE_METHOD' | 'MIND_MAP' | 'CHARTING';

export interface EditorState {
  history: {
    past: Notebook[][];
    present: Notebook[];
    future: Notebook[][];
  };
  activeNotebookId: string | null;
  activePageId: string | null;
  selectedTool: Tool;
  interactionState: 'IDLE' | 'DRAWING' | 'MOVING' | 'RESIZING' | 'PANNING' | 'EDITING_TEXT';
  currentElementId: string | null;
  startPoint: { x: number; y: number } | null;
  selectedElement: { pageId: string, elementId: string } | null;
  elementSnapshot: CanvasElement | null;
  historySnapshot: Notebook[] | null;
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
  | { type: 'ADD_PAGE'; payload: { notebookId: string, template?: Template } }
  | { type: 'DELETE_PAGE'; payload: { notebookId: string, pageId: string } }
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
  | { type: 'CREATE_BOUND_TEXT'; payload: { pageId: string; containerId: string } }
  | { type: 'CREATE_EDGE_LABEL'; payload: { pageId: string; edgeId: string } }
  | { type: 'UPDATE_ELEMENT_PROPERTIES'; payload: { properties: Partial<CanvasElement> } }
  | { type: 'FIT_CONTAINER_TO_TEXT' }
  | { type: 'WRAP_TEXT_IN_CONTAINER' }
  | { type: 'BRING_TO_FRONT' }
  | { type: 'SEND_TO_BACK' }
  | { type: 'BRING_FORWARD' }
  | { type: 'SEND_BACKWARD' }
  | { type: 'UNDO' }
  | { type: 'REDO' };