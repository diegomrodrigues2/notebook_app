import React from 'react';
import { Tool } from '../../types/elements';
import { SelectIcon, HandIcon, RectangleIcon, EllipseIcon, LineIcon, PencilIcon, ArrowIcon, CurveIcon, TextIcon } from '../../components/icons';

interface ToolbarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

const tools: { name: Tool; icon: React.ReactNode }[] = [
  { name: 'SELECT', icon: <SelectIcon /> },
  { name: 'HAND', icon: <HandIcon /> },
  { name: 'RECTANGLE', icon: <RectangleIcon /> },
  { name: 'ELLIPSE', icon: <EllipseIcon /> },
  { name: 'LINE', icon: <LineIcon /> },
  { name: 'ARROW', icon: <ArrowIcon /> },
  { name: 'CURVE', icon: <CurveIcon /> },
  { name: 'TEXT', icon: <TextIcon /> },
  { name: 'FREEDRAW', icon: <PencilIcon /> },
];

export function Toolbar({ selectedTool, onToolSelect }: ToolbarProps): React.ReactNode {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200">
      {tools.map(({ name, icon }) => (
        <button
          key={name}
          onClick={() => onToolSelect(name)}
          className={`p-2 rounded-md transition-colors ${
            selectedTool === name
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-label={`Select ${name} tool`}
          title={name.charAt(0) + name.slice(1).toLowerCase()}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}