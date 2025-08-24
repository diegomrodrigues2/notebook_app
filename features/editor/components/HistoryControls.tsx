
import React from 'react';
import { EditorAction } from '../editor.types';
import { RedoIcon, UndoIcon } from '../../../components/icons';

interface HistoryControlsProps {
    canUndo: boolean;
    canRedo: boolean;
    dispatch: React.Dispatch<EditorAction>;
}

export function HistoryControls({ canUndo, canRedo, dispatch }: HistoryControlsProps): React.ReactNode {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-1 flex gap-1 border border-gray-200">
      <button
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo}
        className="p-2 rounded-md transition-colors disabled:text-gray-300 disabled:cursor-not-allowed enabled:hover:bg-gray-100 text-gray-700"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <UndoIcon />
      </button>
      <button
        onClick={() => dispatch({ type: 'REDO' })}
        disabled={!canRedo}
        className="p-2 rounded-md transition-colors disabled:text-gray-300 disabled:cursor-not-allowed enabled:hover:bg-gray-100 text-gray-700"
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <RedoIcon />
      </button>
    </div>
  )
}
