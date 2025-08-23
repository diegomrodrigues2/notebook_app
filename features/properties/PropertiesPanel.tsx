import React from 'react';
import { CanvasElement, RectangleElement, StrokeStyle, Roundness, EllipseElement, FillStyle, TextElement } from '../../types/elements';
import { STROKE_WIDTHS, COLOR_PALETTE, FONT_SIZES } from '../../constants';

interface PropertiesPanelProps {
  element: CanvasElement;
  onUpdate: (properties: Partial<CanvasElement>) => void;
}

const isFillable = (element: CanvasElement): element is RectangleElement | EllipseElement => 
  element.type === 'RECTANGLE' || element.type === 'ELLIPSE';

const isRectangle = (element: CanvasElement): element is RectangleElement => 
  element.type === 'RECTANGLE';

const isText = (element: CanvasElement): element is TextElement => 
  element.type === 'TEXT';

const SolidIcon = (): React.ReactNode => <div className="w-full h-full bg-gray-500 rounded-sm"></div>;
const HachureIcon = (): React.ReactNode => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="hachure-preview" patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#6b7280" strokeWidth="1.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hachure-preview)" className="rounded-sm" />
    </svg>
);
const CrossHatchIcon = (): React.ReactNode => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="crosshatch-preview" patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#6b7280" strokeWidth="1.2" />
                <path d="M-1,7 l2,2 M0,0 l8,8 M7,-1 l2,2" stroke="#6b7280" strokeWidth="1.2" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#crosshatch-preview)" className="rounded-sm" />
    </svg>
);

const fillStyleIcons: { style: FillStyle; icon: React.ReactNode; label: string }[] = [
    { style: 'solid', icon: <SolidIcon />, label: 'Solid' },
    { style: 'hachure', icon: <HachureIcon />, label: 'Hachure' },
    { style: 'cross-hatch', icon: <CrossHatchIcon />, label: 'Cross-hatch' },
];

export function PropertiesPanel({ element, onUpdate }: PropertiesPanelProps): React.ReactNode {
  const transparentBackgroundStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1 1l2-2m0 10l10-10M9 11l2-2' stroke='%23CCC' stroke-width='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: '10px 10px',
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 flex flex-col gap-4 border border-gray-200 w-60" aria-label="Properties Panel">
      {/* Stroke Color */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600" id="stroke-color-label">{isText(element) ? 'Color' : 'Stroke Color'}</h3>
        <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="stroke-color-label">
          {COLOR_PALETTE.map(color => (
            <button
              key={`stroke-${color}`}
              onClick={() => onUpdate({ stroke: color })}
              className={`w-6 h-6 rounded-full border-2 ${element.stroke === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
              style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color, ...(color === 'transparent' ? transparentBackgroundStyle : {}) }}
              aria-label={`Set stroke color to ${color === 'transparent' ? 'transparent' : color}`}
              title={`Stroke: ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Fill Color (for fillable shapes) */}
      {isFillable(element) && (
         <div className="space-y-2">
           <h3 className="text-sm font-medium text-gray-600" id="fill-color-label">Fill Color</h3>
           <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="fill-color-label">
             {COLOR_PALETTE.map(color => (
               <button
                 key={`fill-${color}`}
                 onClick={() => onUpdate({ fill: color })}
                 className={`w-6 h-6 rounded-full border-2 ${element.fill === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
                 style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color, ...(color === 'transparent' ? transparentBackgroundStyle : {}) }}
                 aria-label={`Set fill color to ${color === 'transparent' ? 'transparent' : color}`}
                 title={`Fill: ${color}`}
                />
             ))}
           </div>
         </div>
      )}

      {/* Fill Style (for fillable shapes) */}
      {isFillable(element) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600" id="fill-style-label">Fill Style</h3>
          <div className="flex justify-between gap-2" role="group" aria-labelledby="fill-style-label">
            {fillStyleIcons.map(({ style, icon, label }) => (
              <button
                key={style}
                onClick={() => onUpdate({ fillStyle: style })}
                className={`p-1.5 rounded-md transition-colors w-full h-10 border-2 ${element.fillStyle === style ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                title={label}
                aria-label={`Set fill style to ${label}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Stroke Width / Font Size */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600" id="size-label">
          {isText(element) ? 'Font Size' : 'Stroke Width'}
        </h3>
        <div className="flex justify-between gap-2" role="group" aria-labelledby="size-label">
          {(isText(element) ? FONT_SIZES : STROKE_WIDTHS).map(size => (
            <button
              key={size}
              onClick={() => onUpdate(isText(element) ? { fontSize: size } : { strokeWidth: size })}
              className={`px-3 py-1 text-sm rounded-md transition-colors w-full ${
                (isText(element) ? (element as TextElement).fontSize : element.strokeWidth) === size 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`
              }
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
      
      {/* Stroke Style */}
      {!isText(element) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600" id="stroke-style-label">Stroke Style</h3>
          <div className="flex justify-between gap-2" role="group" aria-labelledby="stroke-style-label">
            {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map(style => (
              <button
                key={style}
                onClick={() => onUpdate({ strokeStyle: style })}
                className={`px-3 py-1 text-sm rounded-md transition-colors w-full capitalize ${element.strokeStyle === style ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Corners (for rectangles) */}
      {isRectangle(element) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600" id="corners-label">Corners</h3>
          <div className="flex justify-between gap-2" role="group" aria-labelledby="corners-label">
            {(['sharp', 'round'] as Roundness[]).map(roundness => (
              <button
                key={roundness}
                onClick={() => onUpdate({ roundness })}
                className={`px-3 py-1 text-sm rounded-md transition-colors w-full capitalize ${element.roundness === roundness ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {roundness}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}