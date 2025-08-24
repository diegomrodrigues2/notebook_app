
import { CanvasElement, CurveElement, EllipseElement, LineElement, RectangleElement, TextElement } from '../../types/elements';
import { Template } from '../editor/editor.types';
import { A4_HEIGHT, A4_WIDTH, DEFAULT_FONT_FAMILY } from '../../constants';
import { generateId } from '../../utils/id';

export const createTemplateElements = (template: Template): CanvasElement[] => {
    if (template === 'BLANK') {
        return [];
    }

    const elements: CanvasElement[] = [];
    let z = 0;
    const baseTextProps = {
        seed: Math.random() * 1_000_000,
        fill: 'transparent',
        fillStyle: 'solid' as const,
        strokeWidth: 0,
        strokeStyle: 'solid' as const,
        fontFamily: DEFAULT_FONT_FAMILY,
    };

    if (template === 'CORNELL') {
        const cuesColumnWidth = 180;
        const summarySectionHeight = 150;
        const topMargin = 80;
        const bottomMargin = 20;

        elements.push({
            type: 'TEXT', id: generateId(), x: 30, y: 20, width: 150, height: 28, text: 'Tópico/Título:', fontSize: 24, stroke: '#1e1e1e', ...baseTextProps, zIndex: ++z
        } as TextElement);
        elements.push({
            type: 'TEXT', id: generateId(), x: 30, y: 50, width: 250, height: 20, text: 'Questão(ões) Essencial(is):', fontSize: 16, stroke: '#555', ...baseTextProps, zIndex: ++z
        } as TextElement);

        elements.push({
            type: 'LINE', id: generateId(), x: cuesColumnWidth, y: topMargin, width: 0, height: A4_HEIGHT - topMargin - summarySectionHeight - bottomMargin, 
            points: [[cuesColumnWidth, topMargin], [cuesColumnWidth, A4_HEIGHT - summarySectionHeight - bottomMargin]],
            stroke: '#cccccc', strokeWidth: 1, strokeStyle: 'solid', fill: 'transparent', fillStyle: 'solid', seed: Math.random() * 1_000_000, zIndex: ++z,
        } as LineElement);
        elements.push({
            type: 'LINE', id: generateId(), x: 0, y: A4_HEIGHT - summarySectionHeight - bottomMargin, width: A4_WIDTH, height: 0,
            points: [[20, A4_HEIGHT - summarySectionHeight - bottomMargin], [A4_WIDTH - 20, A4_HEIGHT - summarySectionHeight - bottomMargin]],
            stroke: '#cccccc', strokeWidth: 1, strokeStyle: 'solid', fill: 'transparent', fillStyle: 'solid', seed: Math.random() * 1_000_000, zIndex: ++z,
        } as LineElement);

        elements.push({
            type: 'TEXT', id: generateId(), x: 30, y: topMargin + 10, width: 100, height: 24, text: 'Pistas', fontSize: 20, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);
        elements.push({
            type: 'TEXT', id: generateId(), x: cuesColumnWidth + 20, y: topMargin + 10, width: 100, height: 24, text: 'Anotações', fontSize: 20, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);
         elements.push({
            type: 'TEXT', id: generateId(), x: 30, y: A4_HEIGHT - summarySectionHeight - bottomMargin + 10, width: 100, height: 24, text: 'Resumo', fontSize: 20, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);
        
    }

    return elements;
};