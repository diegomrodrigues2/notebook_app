import { CanvasElement, CurveElement, FreeDrawElement, LineElement, ArrowElement, ResizeHandle } from '../types/elements';

export const getSVGCoordinates = (
  svgElement: SVGSVGElement,
  event: { clientX: number; clientY: number }
): { x: number; y: number } => {
  const point = svgElement.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const ctm = svgElement.getScreenCTM()?.inverse();
  if (ctm) {
    return point.matrixTransform(ctm);
  }
  return { x: 0, y: 0 };
};

export const resizeElement = (
  element: CanvasElement,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number
): CanvasElement => {
  const { x, y, width, height } = element;
  const newElement = { ...element };

  // Store original dimensions for scaling points if it's a point-based element
  const originalX = element.x;
  const originalY = element.y;
  const originalWidth = element.width;
  const originalHeight = element.height;

  switch (handle) {
    case 'nw':
      newElement.x = x + deltaX;
      newElement.y = y + deltaY;
      newElement.width = width - deltaX;
      newElement.height = height - deltaY;
      break;
    case 'n':
      newElement.y = y + deltaY;
      newElement.height = height - deltaY;
      break;
    case 'ne':
      newElement.y = y + deltaY;
      newElement.width = width + deltaX;
      newElement.height = height - deltaY;
      break;
    case 'e':
      newElement.width = width + deltaX;
      break;
    case 'se':
      newElement.width = width + deltaX;
      newElement.height = height + deltaY;
      break;
    case 's':
      newElement.height = height + deltaY;
      break;
    case 'sw':
      newElement.x = x + deltaX;
      newElement.width = width - deltaX;
      newElement.height = height + deltaY;
      break;
    case 'w':
      newElement.x = x + deltaX;
      newElement.width = width - deltaX;
      break;
  }

  // Handle flipping by ensuring width and height are non-negative
  if (newElement.width < 0) {
      newElement.x += newElement.width;
      newElement.width *= -1;
  }
  if (newElement.height < 0) {
      newElement.y += newElement.height;
      newElement.height *= -1;
  }

  const scaleX = originalWidth === 0 ? 1 : newElement.width / originalWidth;
  const scaleY = originalHeight === 0 ? 1 : newElement.height / originalHeight;

  const scalePoints = (points: [number, number][]): [number, number][] => {
    return points.map(([px, py]) => {
      const relativeX = px - originalX;
      const relativeY = py - originalY;
      return [
        newElement.x + relativeX * scaleX,
        newElement.y + relativeY * scaleY
      ] as [number, number];
    });
  };

  // If it's a point-based element, we need to scale its internal points
  if (newElement.type === 'FREEDRAW') {
    (newElement as FreeDrawElement).points = scalePoints((newElement as FreeDrawElement).points);
  } else if (newElement.type === 'CURVE') {
    (newElement as CurveElement).points = scalePoints((newElement as CurveElement).points) as [[number, number], [number, number], [number, number]];
  } else if (newElement.type === 'LINE' || newElement.type === 'ARROW') {
    (newElement as LineElement | ArrowElement).points = scalePoints((newElement as LineElement | ArrowElement).points) as [[number, number], [number, number]];
  }


  return newElement;
};