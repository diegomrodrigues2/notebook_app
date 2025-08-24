
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
        const { width, height } = measureText(newText, editingElementInfo.fontSize, editingElementInfo.fontFamily);
        dispatch({ type: 'EDIT_ELEMENT_TEXT', payload: { text: newText, width, height }});
    };

    const handleTextareaBlur = () => {
        dispatch({ type: 'FINISH_INTERACTION' });
    };

    return (
        <textarea
            ref={textareaRef}
            value={editingText}
            onChange={handleTextChange}
            onBlur={handleTextareaBlur}
            style={{
                position: 'absolute',
                left: `${(editingElementInfo.x + editingElementInfo.pageOffset) * camera.zoom + camera.x}px`,
                top: `${editingElementInfo.y * camera.zoom + camera.y}px`,
                width: `${Math.max(editingElementInfo.width, 50) * camera.zoom}px`,
                height: `${Math.max(editingElementInfo.height, editingElementInfo.fontSize * 1.2) * camera.zoom}px`,
                fontSize: `${editingElementInfo.fontSize * camera.zoom}px`,
                fontFamily: editingElementInfo.fontFamily,
                lineHeight: 1.2,
                color: editingElementInfo.stroke,
                border: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre',
            }}
        />
    );
}
