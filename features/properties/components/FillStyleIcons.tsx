
import React from 'react';
import { FillStyle } from '../../../types/elements';

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

export const fillStyleIcons: { style: FillStyle; icon: React.ReactNode; label: string }[] = [
    { style: 'solid', icon: <SolidIcon />, label: 'Solid' },
    { style: 'hachure', icon: <HachureIcon />, label: 'Hachure' },
    { style: 'cross-hatch', icon: <CrossHatchIcon />, label: 'Cross-hatch' },
];
