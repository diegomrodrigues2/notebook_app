
import React, { useReducer, useEffect, useState } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { Canvas } from '../canvas/Canvas';
import { editorReducer, initialState, EditorAction } from './editorReducer';
import { Tool } from '../../types/elements';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { ZoomControls } from '../zoom/ZoomControls';
import { Sidebar } from '../sidebar/Sidebar';

function Editor(): React.ReactNode {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeNotebook = state.notebooks.find(n => n.id === state.activeNotebookId);
  const activePageIndex = activeNotebook?.pages.findIndex(p => p.id === state.activePageId) ?? -1;

  const leftPageIndex = activePageIndex !== -1 ? activePageIndex - (activePageIndex % 2) : -1;
  const leftPage = leftPageIndex !== -1 ? activeNotebook?.pages[leftPageIndex] : null;
  const rightPage = leftPageIndex !== -1 && activeNotebook && leftPageIndex + 1 < activeNotebook.pages.length 
    ? activeNotebook.pages[leftPageIndex + 1] 
    : null;

  let selectedElement = null;
  if (state.selectedElement && activeNotebook) {
    const page = activeNotebook.pages.find(p => p.id === state.selectedElement.pageId);
    if (page) {
      selectedElement = page.elements.find(el => el.id === state.selectedElement.elementId) || null;
    }
  }

  const handleToolSelect = (tool: Tool) => {
    dispatch({ type: 'SELECT_TOOL', payload: tool });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
          event.preventDefault();
          setIsSpacePressed(true);
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedElement) {
        dispatch({ type: 'DELETE_SELECTED_ELEMENT' });
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
  }, [state.selectedElement]);
  
  return (
    <div className="flex w-full h-full">
      <Sidebar
        notebooks={state.notebooks}
        activeNotebookId={state.activeNotebookId}
        activePageId={state.activePageId}
        dispatch={dispatch as React.Dispatch<EditorAction>}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="relative flex-1 h-full">
        {selectedElement && (
          <PropertiesPanel
            element={selectedElement}
            onUpdate={(properties) =>
              dispatch({
                type: 'UPDATE_ELEMENT_PROPERTIES',
                payload: { properties },
              })
            }
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
