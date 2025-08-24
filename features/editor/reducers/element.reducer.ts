import { EditorState, EditorAction } from '../editor.types';
import { CanvasElement, TextElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks, commitHistory } from '../editor.helpers';
import { measureText } from '../../../utils/text';

export function elementReducer(state: EditorState, action: EditorAction): EditorState {
  const { present } = state.history;

  switch (action.type) {
    case 'UPDATE_ELEMENT_PROPERTIES': {
      if (!state.selectedElement) return state;
      const { pageId, elementId } = state.selectedElement;
      const pageResult = findPage(present, pageId);
      if (!pageResult) return state;

      const page = pageResult.page;
      const updatedElements = page.elements.map(el => {
        if (el.id !== elementId) return el;
        
        const newProperties = action.payload.properties;
        const updatedElement = { ...el, ...newProperties };

        if (updatedElement.type === 'TEXT' && 'fontSize' in newProperties && typeof newProperties.fontSize === 'number') {
          const { width, height } = measureText((updatedElement as TextElement).text, newProperties.fontSize, (updatedElement as TextElement).fontFamily);
          (updatedElement as TextElement).width = width;
          (updatedElement as TextElement).height = height;
        }
        return updatedElement as CanvasElement;
      });
      
      const updatedPage = { ...page, elements: updatedElements };
      const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
      
      return { ...commitHistory(state, newPresent), currentStyle: { ...state.currentStyle, ...action.payload.properties } };
    }

    case 'BRING_TO_FRONT':
    case 'SEND_TO_BACK':
    case 'BRING_FORWARD':
    case 'SEND_BACKWARD': {
        if (!state.selectedElement) return state;
        const { pageId, elementId } = state.selectedElement;
        const pageResult = findPage(present, pageId);
        if (!pageResult) return state;

        const sortedElements = [...pageResult.page.elements].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedElements.findIndex(el => el.id === elementId);
        if (currentIndex === -1) return state;

        let updatedElements: CanvasElement[] = [];

        if (action.type === 'BRING_TO_FRONT') {
            if (sortedElements.length < 2) return state;
            const maxZIndex = sortedElements[sortedElements.length - 1].zIndex;
            updatedElements = pageResult.page.elements.map(el => 
                el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } : el
            );
        } else if (action.type === 'SEND_TO_BACK') {
            if (sortedElements.length < 2) return state;
            const minZIndex = sortedElements[0].zIndex;
            updatedElements = pageResult.page.elements.map(el => 
                el.id === elementId ? { ...el, zIndex: minZIndex - 1 } : el
            );
        } else if (action.type === 'BRING_FORWARD') {
            if (currentIndex >= sortedElements.length - 1) return state; // Already at front
            const nextElement = sortedElements[currentIndex + 1];
            const currentZIndex = sortedElements[currentIndex].zIndex;
            const nextZIndex = nextElement.zIndex;
            updatedElements = pageResult.page.elements.map(el => {
                if (el.id === elementId) return { ...el, zIndex: nextZIndex };
                if (el.id === nextElement.id) return { ...el, zIndex: currentZIndex };
                return el;
            });
        } else if (action.type === 'SEND_BACKWARD') {
            if (currentIndex <= 0) return state; // Already at back
            const prevElement = sortedElements[currentIndex - 1];
            const currentZIndex = sortedElements[currentIndex].zIndex;
            const prevZIndex = prevElement.zIndex;
            updatedElements = pageResult.page.elements.map(el => {
                if (el.id === elementId) return { ...el, zIndex: prevZIndex };
                if (el.id === prevElement.id) return { ...el, zIndex: currentZIndex };
                return el;
            });
        }
        
        if (updatedElements.length > 0) {
            const updatedPage = { ...pageResult.page, elements: updatedElements };
            const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
            return commitHistory(state, newPresent);
        }

        return state;
    }
    
    default:
        return state;
  }
}
