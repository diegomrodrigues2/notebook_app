

import React, { useState, useEffect, useRef } from 'react';
import { Notebook, EditorAction, Template } from '../editor/editor.types';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, MenuIcon, TrashIcon } from '../../components/icons';

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  activePageId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type EditingState = { type: 'notebook' | 'page'; id: string } | null;

export function Sidebar({ notebooks, activeNotebookId, activePageId, dispatch, isOpen, setIsOpen }: SidebarProps): React.ReactNode {
    const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());
    const [editing, setEditing] = useState<EditingState>(null);
    const [tempName, setTempName] = useState('');
    const [openedAddPageMenu, setOpenedAddPageMenu] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeNotebookId) {
            setExpandedNotebooks(prev => new Set(prev).add(activeNotebookId));
        }
    }, [activeNotebookId]);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [editing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenedAddPageMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleStartEditing = (type: 'notebook' | 'page', id: string, currentName: string) => {
        setEditing({ type, id });
        setTempName(currentName);
    }

    const handleFinishEditing = () => {
        if (!editing) return;

        if (tempName.trim()) {
            if (editing.type === 'notebook') {
                dispatch({ type: 'RENAME_NOTEBOOK', payload: { notebookId: editing.id, newName: tempName } });
            } else {
                dispatch({ type: 'RENAME_PAGE', payload: { pageId: editing.id, newName: tempName } });
            }
        }
        setEditing(null);
        setTempName('');
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') handleFinishEditing();
        if (event.key === 'Escape') setEditing(null);
    }

    const toggleNotebook = (notebookId: string) => {
        setExpandedNotebooks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(notebookId)) {
                newSet.delete(notebookId);
            } else {
                newSet.add(notebookId);
            }
            return newSet;
        });
    };

    const handleAddNotebook = () => dispatch({ type: 'ADD_NOTEBOOK' });
    const handleAddPage = (notebookId: string, template: Template) => {
        dispatch({ type: 'ADD_PAGE', payload: { notebookId, template } });
        setOpenedAddPageMenu(null);
    };
    const handleSelectPage = (notebookId: string, pageId: string) => dispatch({ type: 'SELECT_PAGE', payload: { notebookId, pageId } });

    if (!isOpen) {
        return (
            <div className="absolute top-4 left-4 z-20">
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="p-2 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-100"
                    aria-label="Open sidebar"
                    title="Open sidebar"
                >
                    <MenuIcon />
                </button>
            </div>
        );
    }
    
    return (
        <aside className="w-64 h-screen bg-white shadow-lg flex flex-col p-3 shrink-0 z-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-bold text-gray-800">Notebooks</h1>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-gray-200" aria-label="Close sidebar" title="Close sidebar">
                    <MenuIcon />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-3 space-y-2">
                {notebooks.map(notebook => (
                    <div key={notebook.id}>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
                            {editing?.type === 'notebook' && editing.id === notebook.id ? (
                                <input ref={inputRef} type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleFinishEditing} onKeyDown={handleKeyDown} className="w-full bg-gray-100 border border-blue-400 rounded-md px-1 -mx-1 text-sm font-semibold"/>
                            ) : (
                                <span onDoubleClick={() => handleStartEditing('notebook', notebook.id, notebook.name)} onClick={() => toggleNotebook(notebook.id)} className="font-semibold text-gray-700 truncate cursor-pointer flex-1" title={notebook.name}>{notebook.name}</span>
                            )}
                            <button onClick={() => toggleNotebook(notebook.id)} className="ml-2 shrink-0" aria-expanded={expandedNotebooks.has(notebook.id)}>
                                {expandedNotebooks.has(notebook.id) ? <ChevronDownIcon/> : <ChevronRightIcon/>}
                            </button>
                        </div>
                        {expandedNotebooks.has(notebook.id) && (
                            <div className="pl-4 mt-1 space-y-1">
                                {notebook.pages.map(page => {
                                    return (
                                        <div 
                                            key={page.id}
                                            className={`flex items-center justify-between p-2 rounded-md text-sm group ${activePageId === page.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                        >
                                            <div
                                                onDoubleClick={() => handleStartEditing('page', page.id, page.name)}
                                                onClick={() => handleSelectPage(notebook.id, page.id)}
                                                className={`flex-1 cursor-pointer truncate ${activePageId === page.id ? 'text-blue-800 font-semibold' : 'text-gray-600'}`}
                                                title={page.name}
                                            >
                                                {editing?.type === 'page' && editing.id === page.id ? (
                                                    <input ref={inputRef} type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleFinishEditing} onKeyDown={handleKeyDown} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} className="w-full bg-gray-50 border border-blue-400 rounded-md px-1 -mx-1 text-sm"/>
                                                ) : (
                                                    page.name
                                                )}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_PAGE', payload: { notebookId: notebook.id, pageId: page.id } }); }}
                                                className="ml-2 shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
                                                aria-label={`Delete page ${page.name}`}
                                                title="Delete page"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="relative" ref={menuRef}>
                                    <button onClick={() => setOpenedAddPageMenu(openedAddPageMenu === notebook.id ? null : notebook.id)} className="flex items-center gap-2 p-2 rounded-md text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200 w-full mt-1">
                                        <PlusIcon />
                                        <span>Add Page</span>
                                    </button>
                                    {openedAddPageMenu === notebook.id && (
                                        <div className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 z-30">
                                            <button onClick={() => handleAddPage(notebook.id, 'BLANK')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Página em Branco</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'CORNELL')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Notas Cornell</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'OUTLINING')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Método de Tópicos</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'SENTENCE_METHOD')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Método de Sentenças</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'MIND_MAP')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Mapa Mental</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'CHARTING')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Método de Gráficos</button>
                                            <button onClick={() => handleAddPage(notebook.id, 'TEXTBOOK')} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Estilo Livro Didático</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={handleAddNotebook} className="flex items-center justify-center gap-2 p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors w-full mt-4">
                <PlusIcon />
                <span className="font-semibold">New Notebook</span>
            </button>
        </aside>
    );
}