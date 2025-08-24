import { EditorState, EditorAction } from '../editor.types';
import { findPage, updatePageInNotebooks, commitHistory } from '../editor.helpers';

export function selectionReducer(state: EditorState, action: EditorAction): EditorState {
  const { present } = state.history;

  switch (action.type) {
    case 'SELECT_TOOL':
      return { ...state, selectedTool: action.payload, selectedElement: null, selectedIds: null };
    
    case 'SELECT_ELEMENT': {
      const { pageId, elementId } = action.payload;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;
      
      const selectedElement = pageResult.page.elements.find(el => el.id === elementId);
      if (!selectedElement) return state;
      
      const newCurrentStyle = { ...state.currentStyle };
      if('stroke' in selectedElement) newCurrentStyle.stroke = selectedElement.stroke;
      if (selectedElement.type !== 'TEXT' && 'strokeWidth' in selectedElement) {
        newCurrentStyle.strokeWidth = selectedElement.strokeWidth;
      }
      if('strokeStyle' in selectedElement) newCurrentStyle.strokeStyle = selectedElement.strokeStyle;
      if('fill' in selectedElement) newCurrentStyle.fill = selectedElement.fill;
      if('fillStyle' in selectedElement) newCurrentStyle.fillStyle = selectedElement.fillStyle;
      if(selectedElement.type === 'RECTANGLE') newCurrentStyle.roundness = selectedElement.roundness;
      if(selectedElement.type === 'TEXT') {
        newCurrentStyle.fontSize = selectedElement.fontSize;
        newCurrentStyle.fontFamily = selectedElement.fontFamily;
      }

      return { 
        ...state, 
        selectedElement: action.payload, 
        selectedIds: { pageId, elementIds: [elementId] },
        selectedTool: 'SELECT', 
        currentStyle: newCurrentStyle 
      };
    }

    case 'TOGGLE_ELEMENT_IN_SELECTION': {
      const { pageId, elementId } = action.payload;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;

      const base = state.selectedIds && state.selectedIds.pageId === pageId
        ? state.selectedIds.elementIds.slice()
        : [];
      
      const idx = base.indexOf(elementId);
      if (idx >= 0) {
        base.splice(idx, 1);
      } else {
        base.push(elementId);
      }

      if (base.length === 0) {
        return { ...state, selectedElement: null, selectedIds: null };
      }
      if (base.length === 1) {
        return { ...state, selectedElement: { pageId, elementId: base[0] }, selectedIds: { pageId, elementIds: base } };
      }
      return { ...state, selectedElement: null, selectedIds: { pageId, elementIds: base } };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedElement: null, selectedIds: null };

    case 'DELETE_SELECTED_ELEMENT': {
      const target = state.selectedIds ?? (state.selectedElement && { pageId: state.selectedElement.pageId, elementIds: [state.selectedElement.elementId] });
      if (!target) return state;

      const { pageId, elementIds } = target;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;
      
      const updatedPage = { ...pageResult.page, elements: pageResult.page.elements.filter(el => !elementIds.includes(el.id)) };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      return { ...commitHistory(state, newPresent), selectedElement: null, selectedIds: null };
    }

    default:
        return state;
  }
}