
import { CanvasElement, Tool } from '../../types/elements';
import { EditorState } from '../editor/editor.types';

export const createElement = (tool: Tool, id: string, x: number, y: number, style: EditorState['currentStyle']): CanvasElement | null => {
    const baseProperties = {
        seed: Math.random() * 1_000_000,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeStyle: style.strokeStyle,
        zIndex: 1, // Will be properly set in the reducer
    };

    switch (tool) {
        case 'RECTANGLE': return { id, x, y, width: 0, height: 0, type: 'RECTANGLE', ...baseProperties, fill: style.fill, fillStyle: style.fillStyle, roundness: style.roundness };
        case 'ELLIPSE': return { id, x, y, width: 0, height: 0, type: 'ELLIPSE', ...baseProperties, fill: style.fill, fillStyle: style.fillStyle };
        case 'LINE': return { id, x, y, width: 0, height: 0, type: 'LINE', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y]] };
        case 'ARROW': return { id, x, y, width: 0, height: 0, type: 'ARROW', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y]] };
        case 'FREEDRAW': return { id, x, y, width: 0, height: 0, type: 'FREEDRAW', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y]] };
        case 'CURVE': return { id, x, y, width: 0, height: 0, type: 'CURVE', ...baseProperties, fill: 'transparent', fillStyle: 'solid', points: [[x, y], [x, y], [x, y]] };
        case 'TEXT': return { id, x, y, width: 0, height: 0, type: 'TEXT', text: '', ...baseProperties, stroke: style.stroke, fill: 'transparent', fillStyle: 'solid', strokeWidth: 0, strokeStyle: 'solid', fontSize: style.fontSize, fontFamily: style.fontFamily };
        default: return null;
    }
};