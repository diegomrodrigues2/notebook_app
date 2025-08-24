import { EditorState, EditorAction } from '../editor.types';
import { findPage, updatePageInNotebooks, commitHistory } from '../editor.helpers';

export function selectionReducer(state: EditorState, action: EditorAction): EditorState {
  const { present } = state.history;

  switch (action.type) {
    case 'SELECT_TOOL':
      return { ...state, selectedTool: action.payload, selectedElement: null };
    
    case 'SELECT_ELEMENT': {
      const { pageId, elementId } = action.payload;
      const pageResult = findPage(present, pageId);
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
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;
      
      const updatedPage = { ...pageResult.page, elements: pageResult.page.elements.filter(el => el.id !== elementId) };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      return { ...commitHistory(state, newPresent), selectedElement: null };
    }

    default:
        return state;
  }
}
