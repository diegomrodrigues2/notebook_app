
import React, { useReducer, useEffect, useState } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { Canvas } from '../canvas/Canvas';
import { editorReducer } from './editor.reducer';
import { initialState } from './editor.state';
import { EditorAction } from './editor.types';
import { Tool, TextElement } from '../../types/elements';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { ZoomControls } from '../zoom/ZoomControls';
import { Sidebar } from '../sidebar/Sidebar';
import { HistoryControls } from './components/HistoryControls';

function Editor(): React.ReactNode {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const notebooks = state.history.present;
  const activeNotebook = notebooks.find(n => n.id === state.activeNotebookId);
  const activePageIndex = activeNotebook?.pages.findIndex(p => p.id === state.activePageId) ?? -1;

  const leftPageIndex = activePageIndex !== -1 ? activePageIndex - (activePageIndex % 2) : -1;
  const leftPage = leftPageIndex !== -1 ? activeNotebook?.pages[leftPageIndex] : null;
  const rightPage = leftPageIndex !== -1 && activeNotebook && leftPageIndex + 1 < activeNotebook.pages.length 
    ? activeNotebook.pages[leftPageIndex + 1] 
    : null;

  let selectedElement = null;
  let hasBoundText = false;
  if (state.selectedElement && activeNotebook) {
    const page = activeNotebook.pages.find(p => p.id === state.selectedElement.pageId);
    if (page) {
      selectedElement = page.elements.find(el => el.id === state.selectedElement.elementId) || null;
      if (selectedElement && (selectedElement.type === 'RECTANGLE' || selectedElement.type === 'ELLIPSE')) {
        hasBoundText = page.elements.some(el => el.type === 'TEXT' && (el as TextElement).containerId === selectedElement.id);
      }
    }
  }

  const handleToolSelect = (tool: Tool) => {
    dispatch({ type: 'SELECT_TOOL', payload: tool });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && state.interactionState !== 'EDITING_TEXT') {
          event.preventDefault();
          setIsSpacePressed(true);
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedElement) {
        dispatch({ type: 'DELETE_SELECTED_ELEMENT' });
      }

      // F2: edit selected text (Excalidraw-like)
      if (event.key === 'F2' && state.selectedElement) {
        const nb = state.history.present.find(n => n.id === state.activeNotebookId);
        const page = nb?.pages.find(p => p.id === state.selectedElement!.pageId);
        const el = page?.elements.find(e => e.id === state.selectedElement!.elementId);
        if (el?.type === 'TEXT') {
          event.preventDefault();
          dispatch({ type: 'START_EDITING_TEXT', payload: { pageId: state.selectedElement!.pageId, elementId: el.id } });
          return;
        }
      }

      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
        } else if (event.key === 'y') {
          event.preventDefault();
          dispatch({ type: 'REDO' });
        } else if (event.shiftKey && (event.key === 'B' || event.key === 'b')) {
          event.preventDefault();
          dispatch({ type: 'WRAP_TEXT_IN_CONTAINER' });
        } else if (event.shiftKey && (event.key === 'J' || event.key === 'j')) {
          event.preventDefault();
          dispatch({ type: 'FIT_CONTAINER_TO_TEXT' });
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
            event.preventDefault();
            setIsSpacePressed(false);
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.selectedElement, state.activeNotebookId, state.history.present, state.interactionState]);
  
  return (
    <div className="flex w-full h-full">
      <Sidebar
        notebooks={notebooks}
        activeNotebookId={state.activeNotebookId}
        activePageId={state.activePageId}
        dispatch={dispatch as React.Dispatch<EditorAction>}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="relative flex-1 h-full">
        <HistoryControls 
          canUndo={state.history.past.length > 0}
          canRedo={state.history.future.length > 0}
          dispatch={dispatch}
        />
        {selectedElement && (
          <PropertiesPanel
            element={selectedElement}
            hasBoundText={hasBoundText}
            onUpdate={(properties) =>
              dispatch({
                type: 'UPDATE_ELEMENT_PROPERTIES',
                payload: { properties },
              })
            }
            onBringToFront={() => dispatch({ type: 'BRING_TO_FRONT' })}
            onSendToBack={() => dispatch({ type: 'SEND_TO_BACK' })}
            onBringForward={() => dispatch({ type: 'BRING_FORWARD' })}
            onSendBackward={() => dispatch({ type: 'SEND_BACKWARD' })}
            onFitContainerToText={() => dispatch({ type: 'FIT_CONTAINER_TO_TEXT' })}
            onWrapInContainer={() => dispatch({ type: 'WRAP_TEXT_IN_CONTAINER' })}
          />
        )}
        <Toolbar
          selectedTool={state.selectedTool}
          onToolSelect={handleToolSelect}
        />
        <Canvas
          leftPage={leftPage}
          rightPage={rightPage}
          interactionState={state.interactionState}
          selectedTool={state.selectedTool}
          selectedElement={state.selectedElement}
          currentElementId={state.currentElementId}
          dispatch={dispatch as React.Dispatch<EditorAction>}
          camera={state.camera}
          isSpacePressed={isSpacePressed}
        />
        <ZoomControls
          zoom={state.camera.zoom}
          onZoomIn={() => dispatch({ type: 'ZOOM_IN' })}
          onZoomOut={() => dispatch({ type: 'ZOOM_OUT' })}
          onZoomReset={() => dispatch({ type: 'RESET_ZOOM' })}
        />
      </div>
    </div>
  );
}

export default Editor;