
import { generateId } from '../../utils/id';
import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_STROKE_STYLE, DEFAULT_ROUNDNESS, DEFAULT_FILL_STYLE, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY } from '../../constants';
import { EditorState, Notebook } from './editor.types';

const initialPageId = generateId();
const initialNotebookId = generateId();

const initialNotebooks: Notebook[] = [
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
];

export const initialState: EditorState = {
  history: {
    past: [],
    present: initialNotebooks,
    future: [],
  },
  activeNotebookId: initialNotebookId,
  activePageId: initialPageId,
  selectedTool: 'SELECT',
  interactionState: 'IDLE',
  currentElementId: null,
  startPoint: null,
  selectedElement: null,
  selectedIds: null,
  elementSnapshot: null,
  groupSnapshot: null,
  historySnapshot: null,
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