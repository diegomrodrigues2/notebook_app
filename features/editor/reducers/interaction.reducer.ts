import { EditorState, EditorAction } from '../editor.types';
import { findPage, updatePageInNotebooks } from '../editor.helpers';

export function interactionReducer(state: EditorState, action: EditorAction): EditorState {
    const { past, present } = state.history;

    switch (action.type) {
        case 'FINISH_INTERACTION': {
            let finalState: EditorState = { ...state };
            
            if (state.interactionState === 'MARQUEE_SELECTING' && state.marqueeRect) {
                const { x, y, width, height, pageId } = state.marqueeRect;
                // Ignore tiny accidental drags
                if (width > 5 || height > 5) {
                    const marqueeBounds = { x1: x, y1: y, x2: x + width, y2: y + height };
                    const pageResult = findPage(present, pageId);
                    if (pageResult) {
                        const selectedElementIds = pageResult.page.elements
                            .filter(el => {
                                const elBounds = { x1: el.x, y1: el.y, x2: el.x + el.width, y2: el.y + el.height };
                                // Check for intersection
                                return elBounds.x1 < marqueeBounds.x2 && elBounds.x2 > marqueeBounds.x1 &&
                                       elBounds.y1 < marqueeBounds.y2 && elBounds.y2 > marqueeBounds.y1;
                            })
                            .map(el => el.id);

                        if (selectedElementIds.length > 0) {
                            finalState = {
                                ...finalState,
                                selectedIds: { pageId, elementIds: selectedElementIds },
                                selectedElement: selectedElementIds.length === 1 ? { pageId, elementId: selectedElementIds[0] } : null,
                            };
                        }
                    }
                }
            }
            
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
              groupSnapshot: null,
              marqueeRect: null,
          };
        }
        default:
            return state;
    }
}