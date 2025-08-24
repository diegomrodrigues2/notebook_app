
import { EditorState, Notebook, Page } from './editor.types';

export const findPage = (notebooks: Notebook[], pageId: string): { notebook: Notebook; page: Page; notebookIndex: number; pageIndex: number; } | null => {
  for (let notebookIndex = 0; notebookIndex < notebooks.length; notebookIndex++) {
    const notebook = notebooks[notebookIndex];
    const pageIndex = notebook.pages.findIndex(p => p.id === pageId);
    if (pageIndex !== -1) {
      return { notebook, page: notebook.pages[pageIndex], notebookIndex, pageIndex };
    }
  }
  return null;
}

export const updatePageInNotebooks = (notebooks: Notebook[], pageId: string, updatedPage: Page): Notebook[] => {
  const pageLocation = findPage(notebooks, pageId);
  if (!pageLocation) return notebooks;

  const newNotebooks = [...notebooks];
  const newPages = [...newNotebooks[pageLocation.notebookIndex].pages];
  newPages[pageLocation.pageIndex] = updatedPage;
  newNotebooks[pageLocation.notebookIndex] = { ...newNotebooks[pageLocation.notebookIndex], pages: newPages };
  
  return newNotebooks;
}

export const commitHistory = (state: EditorState, newPresent: Notebook[]): EditorState => {
    return {
        ...state,
        history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
        }
    };
};
