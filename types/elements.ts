export type Tool = 'SELECT' | 'HAND' | 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'FREEDRAW' | 'ARROW' | 'CURVE' | 'TEXT';
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type Roundness = 'sharp' | 'round';
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

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
  zIndex: number;
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
  /** Horizontal align inside own box or container inner box */
  textAlign: TextAlign;
  /** Only used when bound to a container (containerId present) */
  verticalAlign?: VerticalAlign;
  /** Wrap long lines to fit width */
  wrap?: boolean;
  /** If present, this text is bound to a container element */
  containerId?: string;       // if text is bound inside a shape
  /** If present, this text is attached to a line/arrow element */
  attachedToId?: string;      // if text is attached to a line/arrow
  /** Padding between text and container inner edge (when bound) or for label background */
  padding?: number;           // inner padding when bound to container, or bg padding on labels
  /** Background color for the text element (e.g., for labels) */
  backgroundColor?: string;   // e.g. 'white' for line/arrow labels
}


// Union type for all possible canvas elements
export type CanvasElement = RectangleElement | EllipseElement | LineElement | FreeDrawElement | ArrowElement | CurveElement | TextElement;