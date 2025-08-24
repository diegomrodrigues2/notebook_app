import { EditorState, EditorAction } from '../editor.types';
import { findPage, updatePageInNotebooks } from '../editor.helpers';

export function interactionReducer(state: EditorState, action: EditorAction): EditorState {
    const { past, present } = state.history;

    switch (action.type) {
        case 'FINISH_INTERACTION': {
            let finalState: EditorState = { ...state };
            
            if (state.interactionState === 'EDITING_TEXT' && state.currentElementId && state.selectedElement) {
              const { pageId } = state.selectedElement;
              const pageResult = findPage(present, pageId);
              if (pageResult) {
                const element = pageResult.page.elements.find(el => el.id === state.currentElementId);
                if (element && element.type === 'TEXT' && element.text.trim() === '') {
                    const updatedPage = { ...pageResult.page, elements: pageResult.page.elements.filter(el => el.id !== state.currentElementId) };
                    const newPresent = updatePageInNotebooks(present, pageId, updatedPage);
                    finalState = { ...finalState, history: { ...finalState.history, present: newPresent }, selectedElement: null };
                }
              }
              finalState = { ...finalState, selectedTool: 'SELECT' };
          }

          const wasUndoableInteraction = state.historySnapshot !== null;
          if (wasUndoableInteraction) {
              finalState = {
                  ...finalState,
                  history: {
                      past: [...past, state.historySnapshot!],
                      present: finalState.history.present,
                      future: [],
                  },
              };
          }

          return {
              ...finalState,
              interactionState: 'IDLE',
              currentElementId: null,
              startPoint: null,
              elementSnapshot: null,
              historySnapshot: null,
              resizeHandle: null,
              cameraSnapshot: null,
          };
        }
        default:
            return state;
    }
}
