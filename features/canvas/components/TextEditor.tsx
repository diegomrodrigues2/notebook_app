
import React, { useState, useRef, useEffect } from 'react';
import { TextElement } from '../../../types/elements';
import { EditorAction } from '../../editor/editor.types';
import { measureText } from '../../../utils/text';

interface TextEditorProps {
    editingElementInfo: TextElement & { pageId: string, pageOffset: number };
    camera: { x: number; y: number; zoom: number };
    dispatch: React.Dispatch<EditorAction>;
}

export function TextEditor({ editingElementInfo, camera, dispatch }: TextEditorProps) {
    const [editingText, setEditingText] = useState(editingElementInfo.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        setEditingText(editingElementInfo.text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }, [editingElementInfo]);

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = event.target.value;
        setEditingText(newText);
        const isBound = Boolean(editingElementInfo.containerId);
        const maxW = editingElementInfo.wrap ? Math.max(10, editingElementInfo.width) : undefined;
        const measured = measureText(newText, editingElementInfo.fontSize, editingElementInfo.fontFamily, maxW);
        const width = editingElementInfo.wrap ? Math.max(10, editingElementInfo.width) : measured.width;
        dispatch({ type: 'EDIT_ELEMENT_TEXT', payload: { text: newText, width, height: isBound ? editingElementInfo.height : measured.height }});
    };

    const handleTextareaBlur = () => {
        dispatch({ type: 'FINISH_INTERACTION' });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            dispatch({ type: 'FINISH_INTERACTION' });
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={editingText}
            onChange={handleTextChange}
            onBlur={handleTextareaBlur}
            onKeyDown={handleKeyDown}
            style={{
                position: 'absolute',
                left: `${(editingElementInfo.x + editingElementInfo.pageOffset) * camera.zoom + camera.x}px`,
                top: `${(() => {
                  const isBound = Boolean(editingElementInfo.containerId);
                  if (!isBound) return editingElementInfo.y * camera.zoom + camera.y;
                  
                  const { height: textH } = measureText(
                    editingText,
                    editingElementInfo.fontSize,
                    editingElementInfo.fontFamily,
                    editingElementInfo.wrap ? Math.max(1, editingElementInfo.width) : undefined
                  );

                  const innerH = Math.max(1, editingElementInfo.height);
                  const padTop =
                    editingElementInfo.verticalAlign === 'top'
                      ? 0
                      : editingElementInfo.verticalAlign === 'bottom'
                      ? Math.max(0, innerH - textH)
                      : Math.max(0, (innerH - textH) / 2);
                  
                  return (editingElementInfo.y + padTop) * camera.zoom + camera.y;
                })()}px`,
                width: `${Math.max(editingElementInfo.wrap ? editingElementInfo.width : editingElementInfo.width || 50, 50) * camera.zoom}px`,
                height: `${Math.max(editingElementInfo.height, editingElementInfo.fontSize * 1.2) * camera.zoom}px`,
                fontSize: `${editingElementInfo.fontSize * camera.zoom}px`,
                fontFamily: editingElementInfo.fontFamily,
                lineHeight: 1.2,
                textAlign: editingElementInfo.textAlign as any,
                color: editingElementInfo.stroke,
                border: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: editingElementInfo.wrap ? 'pre-wrap' : 'pre',
                wordBreak: 'break-word',
            }}
        />
    );
}