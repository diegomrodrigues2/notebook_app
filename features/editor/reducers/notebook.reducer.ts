import { EditorState, EditorAction, Page, Notebook } from '../editor.types';
import { commitHistory } from '../editor.helpers';
import { createTemplateElements } from '../../templates/template.utils';
import { generateId } from '../../../utils/id';

export function notebookReducer(state: EditorState, action: EditorAction): EditorState {
    const { present } = state.history;

    switch (action.type) {
        case 'ADD_NOTEBOOK': {
            const newPageId = generateId();
            const newNotebookId = generateId();
            const newNotebook = {
                id: newNotebookId,
                name: `Notebook ${present.length + 1}`,
                pages: [{ id: newPageId, name: 'Page 1', elements: [] }],
            };
            const newPresent = [...present, newNotebook];
            return {
                ...commitHistory(state, newPresent),
                activeNotebookId: newNotebookId,
                activePageId: newPageId,
                selectedElement: null,
            };
        }

        case 'ADD_PAGE': {
            const { notebookId, template = 'BLANK' } = action.payload;
            const notebook = present.find(n => n.id === notebookId);
            if (!notebook) return state;

            const newPageId = generateId();
            const newPage: Page = {
                id: newPageId,
                name: `Page ${notebook.pages.length + 1}`,
                elements: createTemplateElements(template),
            };

            const newPresent = present.map(n =>
                n.id === notebookId ? { ...n, pages: [...n.pages, newPage] } : n
            );

            return {
                ...commitHistory(state, newPresent),
                activeNotebookId: notebookId,
                activePageId: newPageId,
                selectedElement: null,
            };
        }

        case 'DELETE_PAGE': {
            const { notebookId, pageId } = action.payload;

            // 1) Clone notebooks shallowly to work immutably
            let newPresent = state.history.present.map(n => ({ ...n, pages: [...n.pages] }));

            // 2) Find notebook & page indices
            const nbIdx = newPresent.findIndex(n => n.id === notebookId);
            if (nbIdx === -1) return state;

            const pageIdx = newPresent[nbIdx].pages.findIndex(p => p.id === pageId);
            if (pageIdx === -1) return state;

            // 3) Remove the page
            newPresent[nbIdx].pages.splice(pageIdx, 1);

            // 4) If that notebook is now empty, remove the notebook
            const notebookEmptied = newPresent[nbIdx]?.pages.length === 0;
            if (notebookEmptied) {
                newPresent.splice(nbIdx, 1);
            }

            // 5) If everything is gone, bootstrap a clean workspace to keep UI stable
            if (newPresent.length === 0) {
                const newNotebookId = generateId();
                const newPageId = generateId();
                newPresent = [
                {
                    id: newNotebookId,
                    name: 'My First Notebook',
                    pages: [{ id: newPageId, name: 'Page 1', elements: [] }],
                },
                ];
                return {
                ...commitHistory(state, newPresent),
                activeNotebookId: newNotebookId,
                activePageId: newPageId,
                selectedElement: null,
                };
            }

            // 6) Determine new active notebook/page IF the deleted page was active
            let newActiveNotebookId = state.activeNotebookId;
            let newActivePageId = state.activePageId;

            if (state.activePageId === pageId) {
                const stillSameNotebookIdx = newPresent.findIndex(n => n.id === notebookId);
                if (stillSameNotebookIdx !== -1) {
                // Notebook still exists; choose a neighbor page in this notebook
                const nb = newPresent[stillSameNotebookIdx];
                // Prefer previous page; if none, stick to the new first page
                let nextIdx = pageIdx - 1;
                if (nextIdx < 0) nextIdx = 0;
                if (nextIdx >= nb.pages.length) nextIdx = nb.pages.length - 1; // safety
                newActiveNotebookId = nb.id;
                newActivePageId = nb.pages[nextIdx].id;
                } else {
                // Notebook was removed; choose a nearby notebook
                const fallbackNbIdx = Math.min(nbIdx, newPresent.length - 1);
                const nb = newPresent[fallbackNbIdx];
                // Pick a reasonable page index near the old one
                let nextIdx = Math.min(Math.max(pageIdx - 1, 0), nb.pages.length - 1);
                newActiveNotebookId = nb.id;
                newActivePageId = nb.pages[nextIdx].id;
                }
            }

            return {
                ...commitHistory(state, newPresent),
                activeNotebookId: newActiveNotebookId,
                activePageId: newActivePageId,
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
            const newPresent = present.map(n =>
                n.id === action.payload.notebookId ? { ...n, name: action.payload.newName } : n
            );
            return commitHistory(state, newPresent);
        }

        case 'RENAME_PAGE': {
            const newPresent = present.map(notebook => ({
                ...notebook,
                pages: notebook.pages.map(page => 
                    page.id === action.payload.pageId ? { ...page, name: action.payload.newName } : page
                ),
            }));
            return commitHistory(state, newPresent);
        }

        default:
            return state;
    }
}