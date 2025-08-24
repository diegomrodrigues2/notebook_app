
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
        
    } else if (template === 'TEXTBOOK') {
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 40, width: 400, height: 40,
            text: 'Título do Capítulo', fontSize: 32, stroke: '#1e1e1e', ...baseTextProps, zIndex: ++z,
        } as TextElement);

        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 90, width: 300, height: 30,
            text: 'Título da Seção', fontSize: 24, stroke: '#444', ...baseTextProps, zIndex: ++z
        } as TextElement);
        
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 140, width: 500, height: 80,
            text: 'Este é o corpo principal do texto. Ele contém as informações essenciais que o leitor precisa entender. Parágrafos bem estruturados ajudam a transmitir a mensagem com clareza.',
            fontSize: 16, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);

        const calloutY = 250;
        const calloutWidth = 515;
        const calloutHeight = 90;
        
        elements.push({
            type: 'RECTANGLE', id: generateId(), x: 40, y: calloutY, width: calloutWidth, height: calloutHeight,
            stroke: '#3683d6', fill: '#eef6fc', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
            roundness: 'sharp', seed: Math.random() * 1_000_000, zIndex: ++z,
        } as RectangleElement);
        elements.push({
            type: 'TEXT', id: generateId(), x: 55, y: calloutY + 15, width: calloutWidth - 30, height: calloutHeight - 30,
            text: 'ℹ️ Nota:\nEsta é uma informação suplementar que enriquece o texto principal, mas não é crítica para o fluxo primário.',
            fontSize: 14, stroke: '#1e4e8c', ...baseTextProps, zIndex: ++z
        } as TextElement);

        const warningY = calloutY + calloutHeight + 20;
        elements.push({
            type: 'RECTANGLE', id: generateId(), x: 40, y: warningY, width: calloutWidth, height: calloutHeight,
            stroke: '#ffc400', fill: '#fff8e6', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
            roundness: 'sharp', seed: Math.random() * 1_000_000, zIndex: ++z,
        } as RectangleElement);
        elements.push({
            type: 'TEXT', id: generateId(), x: 55, y: warningY + 15, width: calloutWidth - 30, height: calloutHeight - 30,
            text: '⚠️ Aviso:\nExecutar isso sem a devida preparação pode levar a consequências indesejadas ou perda de dados.',
            fontSize: 14, stroke: '#8c6d00', ...baseTextProps, zIndex: ++z
        } as TextElement);
    } else if (template === 'OUTLINING') {
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 40, width: 400, height: 40,
            text: 'Título do Esboço', fontSize: 32, stroke: '#1e1e1e', ...baseTextProps, zIndex: ++z,
        } as TextElement);
        
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 100, width: 500, height: 200,
            text: `I. Tópico Principal\n    A. Subtópico\n        1. Detalhe de apoio\n        2. Outro detalhe\n    B. Outro Subtópico\n\nII. Segundo Tópico Principal\n    A. Subtópico`,
            fontSize: 18, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);
    } else if (template === 'SENTENCE_METHOD') {
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 40, width: 500, height: 40,
            text: 'Notas - Método de Sentenças', fontSize: 32, stroke: '#1e1e1e', ...baseTextProps, zIndex: ++z,
        } as TextElement);
        
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 100, width: 500, height: 300,
            text: `1. \n2. \n3. \n4. \n5. \n6. \n7. \n8. \n9. \n10. `,
            fontSize: 16, stroke: '#333', ...baseTextProps, zIndex: ++z
        } as TextElement);
    } else if (template === 'MIND_MAP') {
        const centerX = A4_WIDTH / 2;
        const centerY = A4_HEIGHT / 3;

        // Central idea
        elements.push({
            type: 'ELLIPSE', id: generateId(), x: centerX - 80, y: centerY - 40, width: 160, height: 80,
            stroke: '#1971c2', fill: '#dbe4ff', fillStyle: 'solid', strokeWidth: 2,
            seed: Math.random() * 1_000_000, zIndex: ++z,
        } as EllipseElement);
        elements.push({
            type: 'TEXT', id: generateId(), x: centerX - 40, y: centerY - 15, width: 80, height: 30,
            text: 'Ideia\nCentral', fontSize: 24, stroke: '#1864ab', ...baseTextProps, zIndex: ++z
        } as TextElement);

        // Branches
        const branchPoints = [
            { angle: -45, distance: 150 },
            { angle: 45, distance: 160 },
            { angle: 135, distance: 150 },
            { angle: -150, distance: 170 },
        ];
        
        branchPoints.forEach((p, i) => {
            const rad = p.angle * Math.PI / 180;
            const startX = centerX + 80 * Math.cos(rad);
            const startY = centerY + 40 * Math.sin(rad);
            const endX = centerX + p.distance * Math.cos(rad);
            const endY = centerY + p.distance * Math.sin(rad) * 0.8;
            
            const controlX = (startX + endX) / 2 + (endY - startY) * 0.3;
            const controlY = (startY + endY) / 2 - (endX - startX) * 0.3;

            elements.push({
                type: 'CURVE', id: generateId(), x: Math.min(startX, endX), y: Math.min(startY, endY), 
                width: Math.abs(endX-startX), height: Math.abs(endY-startY),
                points: [[startX, startY], [controlX, controlY], [endX, endY]],
                stroke: '#555', strokeWidth: 2, strokeStyle: 'solid', fill: 'transparent', fillStyle: 'solid', 
                seed: Math.random() * 1_000_000, zIndex: ++z,
            } as CurveElement);
            
            elements.push({
                type: 'TEXT', id: generateId(), x: endX, y: endY - 10, width: 100, height: 20,
                text: `Subtópico ${i + 1}`, fontSize: 18, stroke: '#333', ...baseTextProps, zIndex: ++z
            } as TextElement);
        });
    } else if (template === 'CHARTING') {
        elements.push({
            type: 'TEXT', id: generateId(), x: 40, y: 40, width: 500, height: 40,
            text: 'Tabela Comparativa', fontSize: 32, stroke: '#1e1e1e', ...baseTextProps, zIndex: ++z,
        } as TextElement);
        
        const startX = 40;
        const startY = 100;
        const tableWidth = A4_WIDTH - 2 * startX;
        const rowHeight = 40;
        const numRows = 8;
        const numCols = 4;
        const colWidth = tableWidth / numCols;
        
        const headers = ['Critério', 'Item 1', 'Item 2', 'Item 3'];

        // Vertical Lines
        for (let i = 0; i <= numCols; i++) {
            const x = startX + i * colWidth;
            elements.push({
                type: 'LINE', id: generateId(), x, y: startY, width: 0, height: numRows * rowHeight,
                points: [[x, startY], [x, startY + numRows * rowHeight]],
                stroke: '#cccccc', strokeWidth: 1, strokeStyle: 'solid', fill: 'transparent', fillStyle: 'solid',
                seed: Math.random() * 1_000_000, zIndex: ++z
            } as LineElement);
        }
        
        // Horizontal Lines
        for (let i = 0; i <= numRows; i++) {
            const y = startY + i * rowHeight;
            elements.push({
                type: 'LINE', id: generateId(), x: startX, y, width: tableWidth, height: 0,
                points: [[startX, y], [startX + tableWidth, y]],
                stroke: '#cccccc', strokeWidth: 1, strokeStyle: 'solid', fill: 'transparent', fillStyle: 'solid',
                seed: Math.random() * 1_000_000, zIndex: ++z
            } as LineElement);
        }
        
        // Headers
        for (let i = 0; i < numCols; i++) {
            elements.push({
                type: 'TEXT', id: generateId(), x: startX + i * colWidth + 10, y: startY + 10,
                width: colWidth - 20, height: 20,
                text: headers[i], fontSize: 18, stroke: '#333', ...baseTextProps, zIndex: ++z,
            } as TextElement);
        }
    }

    return elements;
};