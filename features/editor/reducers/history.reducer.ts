import { EditorState, EditorAction } from '../editor.types';

export function historyReducer(state: EditorState, action: EditorAction): EditorState {
  const { past, present, future } = state.history;

  switch (action.type) {
    case 'UNDO': {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        ...state,
        history: {
          past: newPast,
          present: previous,
          future: [present, ...future],
        },
        selectedElement: null,
      };
    }
    case 'REDO': {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        ...state,
        history: {
          past: [...past, present],
          present: next,
          future: newFuture,
        },
        selectedElement: null,
      };
    }
    default:
      return state;
  }
}
