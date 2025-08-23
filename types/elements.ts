export type Tool = 'SELECT' | 'HAND' | 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'FREEDRAW' | 'ARROW' | 'CURVE' | 'TEXT';
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type Roundness = 'sharp' | 'round';
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch';

// Base properties common to all drawable elements
export interface BaseElement {
  id: string;
  seed: number;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  fill: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
}

export interface RectangleElement extends BaseElement {
  type: 'RECTANGLE';
  roundness: Roundness;
}

export interface EllipseElement extends BaseElement {
  type: 'ELLIPSE';
}

// For line, points are [start, end]. x,y,w,h is the bounding box.
export interface LineElement extends BaseElement {
  type: 'LINE';
  points: [[number, number], [number, number]];
}

// For arrow, points are [start, end]. x,y,w,h is the bounding box.
export interface ArrowElement extends BaseElement {
  type: 'ARROW';
  points: [[number, number], [number, number]];
}

// For free draw, points are the core data. x,y,w,h is the bounding box.
export interface FreeDrawElement extends BaseElement {
  type: 'FREEDRAW';
  points: [number, number][];
}

// For curve, points are [start, control, end]. x,y,w,h is the bounding box.
export interface CurveElement extends BaseElement {
  type: 'CURVE';
  points: [[number, number], [number, number], [number, number]];
}

export interface TextElement extends BaseElement {
  type: 'TEXT';
  text: string;
  fontSize: number;
  fontFamily: string;
}


// Union type for all possible canvas elements
export type CanvasElement = RectangleElement | EllipseElement | LineElement | FreeDrawElement | ArrowElement | CurveElement | TextElement;