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

            // Guard: Prevent deleting the last page in the entire workspace.
            const totalPages = present.reduce((sum, notebook) => sum + notebook.pages.length, 0);
            if (totalPages <= 1) {
                return state;
            }

            // Create a flat list of all pages to find the original index of the deleted page.
            const allPagesFlat = present.flatMap(notebook =>
                notebook.pages.map(page => ({ notebookId: notebook.id, pageId: page.id }))
            );
            const deletedPageIndex = allPagesFlat.findIndex(p => p.pageId === pageId);
            if (deletedPageIndex === -1) return state; // Page not found

            // Create a new state by filtering out the deleted page and any notebooks that become empty.
            const newPresent = present
                .map(notebook => ({
                    ...notebook,
                    pages: notebook.pages.filter(page => page.id !== pageId),
                }))
                .filter(notebook => notebook.pages.length > 0);

            // Determine the new active page, but only if the currently active page was the one deleted.
            let newActiveNotebookId = state.activeNotebookId;
            let newActivePageId = state.activePageId;

            if (state.activePageId === pageId) {
                const newPagesFlat = newPresent.flatMap(notebook =>
                    notebook.pages.map(page => ({ notebookId: notebook.id, pageId: page.id }))
                );

                // The new active page should be the one before the deleted page.
                // This is safe because the list is only ever one item shorter.
                const newActiveIndex = Math.max(0, deletedPageIndex - 1);
                
                // There will always be at least one page because of the totalPages guard.
                const newActivePageInfo = newPagesFlat[newActiveIndex];

                newActiveNotebookId = newActivePageInfo.notebookId;
                newActivePageId = newActivePageInfo.pageId;
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