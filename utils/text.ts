
export const measureText = (text: string, fontSize: number, fontFamily: string): { width: number; height: number } => {
    if (typeof document === 'undefined') {
        // Provide a rough estimate for non-browser environments
        const lines = text.split('\n');
        const width = Math.max(...lines.map(line => line.length * fontSize * 0.6));
        return { width, height: lines.length * fontSize * 1.2 };
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return { width: 0, height: 0 };
    context.font = `${fontSize}px ${fontFamily}`;
    const lines = text.split('\n');
    const width = Math.max(...lines.map(line => context.measureText(line).width));
    const height = lines.length * fontSize * 1.2; // 1.2 line height
    return { width: width || 10, height: height || fontSize };
};
