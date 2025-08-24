
import { EditorState, EditorAction } from '../editor.types';
import { TextElement } from '../../../types/elements';
import { findPage, updatePageInNotebooks } from '../editor.helpers';

export function textReducer(state: EditorState, action: EditorAction): EditorState {
    const { present } = state.history;

    switch (action.type) {
        case 'START_EDITING_TEXT': {
            const { pageId, elementId } = action.payload;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;
            const element = pageResult.page.elements.find(el => el.id === elementId);
            if (!element || element.type !== 'TEXT') return state;
            return { ...state, historySnapshot: present, interactionState: 'EDITING_TEXT', currentElementId: elementId, selectedElement: action.payload, selectedTool: 'SELECT' };
        }
        case 'EDIT_ELEMENT_TEXT': {
            if (state.interactionState !== 'EDITING_TEXT' || !state.currentElementId || !state.selectedElement) return state;
            const { pageId } = state.selectedElement;
            const pageResult = findPage(present, pageId);
            if (!pageResult) return state;

            const { text, width, height } = action.payload;
            let updatedElements = pageResult.page.elements.map(el => {
                if (el.id !== state.currentElementId) return el;
                return { ...el, text, width, height } as TextElement;
            });

            // Recenter if bound to a container
            const edited = updatedElements.find(el => el.id === state.currentElementId) as TextElement | undefined;
            if (edited?.containerId) {
                const container = updatedElements.find(el => el.id === edited.containerId);
                if (container && (container.type === 'RECTANGLE' || container.type === 'ELLIPSE')) {
                    updatedElements = updatedElements.map(el =>
                        el.id === edited.id
                        ? { ...edited, x: container.x + (container.width - edited.width) / 2, y: container.y + (container.height - edited.height) / 2 }
                        : el
                    );
                }
            }

            const newPresent = updatePageInNotebooks(present, pageId, { ...pageResult.page, elements: updatedElements });
            return { ...state, history: { ...state.history, present: newPresent } };
        }
        default:
            return state;
    }
}