
import React from 'react';
import { OPEN_COLORS } from '../../../constants';

const QUICK_SELECT_COLORS = [
  '#fa5252', // red[6]
  '#fd7e14', // orange[6]
  '#fab005', // yellow[6]
  '#40c057', // green[6]
  '#228be6', // blue[6]
  '#7950f2', // violet[6]
  '#212529', // gray[9]
];

const PaletteIcon = (): React.ReactNode => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
        <circle cx="12" cy="12" r="1.5"></circle>
        <circle cx="18" cy="6" r="1.5"></circle>
        <circle cx="6" cy="6" r="1.5"></circle>
        <circle cx="6" cy="18" r="1.5"></circle>
        <circle cx="18" cy="18" r="1.5"></circle>
    </svg>
);

interface ColorPickerProps {
    label: string;
    selectedColor: string;
    onColorSelect: (color: string) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, selectedColor, onColorSelect, isExpanded, setIsExpanded }) => {
    const transparentBackgroundStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1 1l2-2m0 10l10-10M9 11l2-2' stroke='%23CCC' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '10px 10px',
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600" id={`${label.toLowerCase().replace(' ','-')}-label`}>{label}</h3>
            <div className="flex items-center gap-1.5">
                {QUICK_SELECT_COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => onColorSelect(color)}
                        className={`w-5 h-5 rounded-full border-2 ${selectedColor === color ? 'ring-2 ring-offset-1 ring-blue-500 border-white' : 'border-transparent hover:border-gray-400'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Set color to ${color}`}
                    />
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                <button
                    onClick={() => onColorSelect('transparent')}
                    className={`w-5 h-5 rounded-full border-2 ${selectedColor === 'transparent' ? 'ring-2 ring-offset-1 ring-blue-500 border-white' : 'border-transparent'}`}
                    style={transparentBackgroundStyle}
                    aria-label="Set color to transparent"
                />
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-100 border-blue-400' : 'border-transparent bg-gray-100 hover:bg-gray-200'}`}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Hide full color palette' : 'Show full color palette'}
                    title={isExpanded ? 'Fewer colors' : 'More colors'}
                >
                    <PaletteIcon />
                </button>
            </div>
            
            {isExpanded && (
                <div className="flex flex-col gap-1 pt-2 border-t mt-2" role="group" aria-labelledby={`${label.toLowerCase().replace(' ','-')}-label`}>
                    {Object.entries(OPEN_COLORS).map(([colorName, shades]) => (
                        <div key={`${label}-row-${colorName}`} className="flex justify-between">
                            {shades.map(color => (
                                <button
                                    key={`${label}-${color}`}
                                    onClick={() => onColorSelect(color)}
                                    className={`w-5 h-5 rounded-sm border ${selectedColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Set color to ${color}`}
                                    title={`${colorName}: ${color}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
