export const wrapTextLines = (
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number
): { lines: string[]; widths: number[] } => {
  // simple greedy word-wrap
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctx = canvas?.getContext('2d') ?? null;
  if (ctx) ctx.font = `${fontSize}px ${fontFamily}`;
  const measure = (s: string) => (ctx ? ctx.measureText(s).width : s.length * fontSize * 0.6);

  const rawLines = text.split('\n');
  const outLines: string[] = [];
  const widths: number[] = [];

  for (const raw of rawLines) {
    if (!maxWidth || raw.trim() === '') {
      outLines.push(raw);
      widths.push(measure(raw));
      continue;
    }
    const words = raw.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (measure(test) <= maxWidth || line === '') {
        line = test;
      } else {
        outLines.push(line);
        widths.push(measure(line));
        line = word;
      }
    }
    outLines.push(line);
    widths.push(measure(line));
  }
  return { lines: outLines, widths };
};

export const measureText = (
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth?: number
): { width: number; height: number; lines: string[] } => {
    if (typeof document === 'undefined') {
        // headless estimate (+ wrapping when maxWidth provided)
        const baseLines = text.split('\n');
        if (!maxWidth) {
          const width = Math.max(...baseLines.map(line => line.length * fontSize * 0.6));
          return { width, height: baseLines.length * fontSize * 1.2, lines: baseLines };
        }
        const { lines, widths } = wrapTextLines(text, fontSize, fontFamily, maxWidth);
        const width = Math.max(10, ...widths);
        return { width, height: lines.length * fontSize * 1.2, lines };
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return { width: 0, height: fontSize, lines: [text] };
    context.font = `${fontSize}px ${fontFamily}`;
    if (maxWidth) {
      const { lines, widths } = wrapTextLines(text, fontSize, fontFamily, maxWidth);
      const width = Math.max(10, ...widths);
      const height = lines.length * fontSize * 1.2;
      return { width, height, lines };
    }
    const lines = text.split('\n');
    const width = Math.max(...lines.map(line => context.measureText(line).width));
    const height = lines.length * fontSize * 1.2; // 1.2 line height
    return { width: width || 10, height: height || fontSize, lines };
};