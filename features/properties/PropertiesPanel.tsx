
import React, { useState } from 'react';
import { CanvasElement, RectangleElement, StrokeStyle, Roundness, EllipseElement, FillStyle, TextElement } from '../../types/elements';
import { STROKE_WIDTHS, FONT_SIZES } from '../../constants';
import { ColorPicker } from './components/ColorPicker';
import { fillStyleIcons } from './components/FillStyleIcons';
import { BringForwardIcon, BringToFrontIcon, SendBackwardIcon, SendToBackIcon } from '../../components/icons';

interface PropertiesPanelProps {
  element: CanvasElement;
  onUpdate: (properties: Partial<CanvasElement>) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const isFillable = (element: CanvasElement): element is RectangleElement | EllipseElement => 
  element.type === 'RECTANGLE' || element.type === 'ELLIPSE';

const isRectangle = (element: CanvasElement): element is RectangleElement => 
  element.type === 'RECTANGLE';

const isText = (element: CanvasElement): element is TextElement => 
  element.type === 'TEXT';

export function PropertiesPanel({ element, onUpdate, onBringToFront, onSendToBack, onBringForward, onSendBackward }: PropertiesPanelProps): React.ReactNode {
  const [isStrokeColorExpanded, setIsStrokeColorExpanded] = useState(false);
  const [isFillColorExpanded, setIsFillColorExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 flex flex-col gap-4 border border-gray-200 w-60" aria-label="Properties Panel">
      <ColorPicker
        label={isText(element) ? 'Color' : 'Stroke Color'}
        selectedColor={element.stroke}
        onColorSelect={(color) => onUpdate({ stroke: color })}
        isExpanded={isStrokeColorExpanded}
        setIsExpanded={setIsStrokeColorExpanded}
      />

      {isFillable(element) && (
         <ColorPicker
          label="Fill Color"
          selectedColor={element.fill}
          onColorSelect={(color) => onUpdate({ fill: color })}
          isExpanded={isFillColorExpanded}
          setIsExpanded={setIsFillColorExpanded}
        />
      )}

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

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600" id="layer-label">Layer</h3>
        <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="layer-label">
          <button onClick={onSendToBack} className="p-1.5 rounded-md transition-colors w-full h-10 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center" title="Send to back" aria-label="Send to back">
              <SendToBackIcon />
          </button>
          <button onClick={onSendBackward} className="p-1.5 rounded-md transition-colors w-full h-10 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center" title="Send backward" aria-label="Send backward">
              <SendBackwardIcon />
          </button>
          <button onClick={onBringForward} className="p-1.5 rounded-md transition-colors w-full h-10 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center" title="Bring forward" aria-label="Bring forward">
              <BringForwardIcon />
          </button>
          <button onClick={onBringToFront} className="p-1.5 rounded-md transition-colors w-full h-10 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center" title="Bring to front" aria-label="Bring to front">
              <BringToFrontIcon />
          </button>
        </div>
      </div>

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