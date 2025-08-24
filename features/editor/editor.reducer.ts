import { EditorState, EditorAction } from './editor.types';
import { historyReducer } from './reducers/history.reducer';
import { notebookReducer } from './reducers/notebook.reducer';
import { selectionReducer } from './reducers/selection.reducer';
import { elementReducer } from './reducers/element.reducer';
import { drawingReducer } from './reducers/drawing.reducer';
import { textReducer } from './reducers/text.reducer';
import { cameraReducer } from './reducers/camera.reducer';
import { transformReducer } from './reducers/transform.reducer';
import { interactionReducer } from './reducers/interaction.reducer';

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UNDO':
    case 'REDO':
      return historyReducer(state, action);

    case 'ADD_NOTEBOOK':
    case 'ADD_PAGE':
    case 'DELETE_PAGE':
    case 'SELECT_PAGE':
    case 'RENAME_NOTEBOOK':
    case 'RENAME_PAGE':
      return notebookReducer(state, action);
    
    case 'SELECT_TOOL':
    case 'SELECT_ELEMENT':
    case 'CLEAR_SELECTION':
    case 'DELETE_SELECTED_ELEMENT':
      return selectionReducer(state, action);

    case 'UPDATE_ELEMENT_PROPERTIES':
    case 'BRING_TO_FRONT':
    case 'SEND_TO_BACK':
    case 'BRING_FORWARD':
    case 'SEND_BACKWARD':
      return elementReducer(state, action);

    case 'START_DRAWING':
    case 'DRAWING':
      return drawingReducer(state, action);

    case 'START_EDITING_TEXT':
    case 'EDIT_ELEMENT_TEXT':
      return textReducer(state, action);
      
    case 'START_PANNING':
    case 'PANNING':
    case 'ZOOM':
    case 'ZOOM_IN':
    case 'ZOOM_OUT':
    case 'RESET_ZOOM':
      return cameraReducer(state, action);
      
    case 'START_MOVING':
    case 'MOVING':
    case 'START_RESIZING':
    case 'RESIZING':
      return transformReducer(state, action);

    case 'FINISH_INTERACTION':
      return interactionReducer(state, action);

    default:
      return state;
  }
}
