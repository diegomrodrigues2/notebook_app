

import React, { useRef, useLayoutEffect } from 'react';
import { line as d3Line } from 'd3-shape';
import { CanvasElement, TextElement, Tool } from '../../types/elements';
import { RoughSVG } from 'roughjs/bin/svg';
import { Options } from 'roughjs/bin/core';

interface ShapeProps {
  element: CanvasElement;
  roughSvg: RoughSVG | null;
  selectedTool: Tool;
  isSelected: boolean;
  pageId: string;
  onPointerDown: (e: React.PointerEvent, elementId: string, pageId: string) => void;
  editingElementId: string | null;
}

export function Shape({ element, roughSvg, selectedTool, isSelected, pageId, onPointerDown, editingElementId }: ShapeProps): React.ReactNode {
  const gRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    if (!roughSvg || !gRef.current || element.type === 'TEXT') {
      return;
    }

    const g = gRef.current;
    while (g.firstChild) {
      g.removeChild(g.firstChild);
    }

    const getStrokeDasharray = (): [number, number] | undefined => {
      switch (element.strokeStyle) {
        case 'dashed':
          return [element.strokeWidth * 4, element.strokeWidth * 4];
        case 'dotted':
          return [element.strokeWidth, element.strokeWidth * 3];
        case 'solid':
        default:
          return undefined;
      }
    };
    
    // Options for shapes without a fill
    const strokeOptions: Options = {
        seed: element.seed,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        strokeLineDash: getStrokeDasharray(),
        roughness: element.type === 'FREEDRAW' ? 0.5 : 1,
        bowing: element.type === 'FREEDRAW' ? 0 : 1,
    };

    // Options for shapes with a fill
    const fillableOptions: Options = {
        ...strokeOptions,
        fill: element.fill,
        fillStyle: element.fillStyle,
    };

    if (element.type === 'RECTANGLE' && element.roundness === 'round') {
        fillableOptions.bowing = 2;
        fillableOptions.roughness = 1.5;
    }
    
    let node: SVGGElement | null = null;
    let arrowHeadNode: SVGGElement | null = null;
    
    switch (element.type) {
      case 'RECTANGLE':
        node = roughSvg.rectangle(element.x, element.y, element.width, element.height, fillableOptions);
        break;
      case 'ELLIPSE':
        node = roughSvg.ellipse(element.x + element.width / 2, element.y + element.height / 2, element.width, element.height, fillableOptions);
        break;
      case 'LINE': {
        const [start, end] = element.points;
        node = roughSvg.line(start[0], start[1], end[0], end[1], strokeOptions);
        break;
      }
      case 'ARROW': {
        const [start, end] = element.points;
        node = roughSvg.line(start[0], start[1], end[0], end[1], strokeOptions);
        
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        const arrowLength = Math.min(25, length / 3);

        const p1 = end;
        const p2: [number, number] = [end[0] - arrowLength * Math.cos(angle - Math.PI / 6), end[1] - arrowLength * Math.sin(angle - Math.PI / 6)];
        const p3: [number, number] = [end[0] - arrowLength * Math.cos(angle + Math.PI / 6), end[1] - arrowLength * Math.sin(angle + Math.PI / 6)];

        arrowHeadNode = roughSvg.polygon([p2, p1, p3], {
            ...strokeOptions,
            fill: element.stroke,
            fillStyle: 'solid',
        });
        break;
      }
      case 'CURVE': {
        const [start, control, end] = element.points;
        const pathData = `M${start[0]},${start[1]} Q${control[0]},${control[1]} ${end[0]},${end[1]}`;
        node = roughSvg.path(pathData, strokeOptions);
        break;
      }
      case 'FREEDRAW': {
        if (element.points.length < 2) break;
        const pathData = d3Line<[number, number]>().x(p => p[0]).y(p => p[1])(element.points);
        if (pathData) {
            node = roughSvg.path(pathData, strokeOptions);
        }
        break;
      }
    }
    
    if (node) g.appendChild(node);
    if (arrowHeadNode) g.appendChild(arrowHeadNode);

  }, [element, roughSvg]);

  if (element.id === editingElementId) return null;
  
  const gProps = {
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, element.id, pageId),
    style: { cursor: selectedTool === 'SELECT' ? (isSelected ? 'move' : 'pointer') : 'default' },
  };

  if (element.type === 'TEXT') {
    const textElement = element as TextElement;
    const lines = textElement.text.split('\n');
    return (
        <text
            x={textElement.x}
            y={textElement.y}
            fontFamily={textElement.fontFamily}
            fontSize={textElement.fontSize}
            fill={textElement.stroke}
            dominantBaseline="hanging"
            pointerEvents="all"
            {...gProps}
        >
            {lines.map((line, index) => (
                <tspan key={index} x={textElement.x} dy={index === 0 ? 0 : `${textElement.fontSize * 1.2}px`}>
                    {line}
                </tspan>
            ))}
        </text>
    );
  }

  return <g ref={gRef} {...gProps} />;
}