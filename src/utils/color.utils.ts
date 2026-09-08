import chroma from 'chroma-js';

export const isColorValid = (value: string) => chroma.valid(value);

export const setColorAlpha = (value: string, alpha: number) => {
  if (!chroma.valid(value)) return value;
  return chroma(value).alpha(alpha).css(); // returns rgba string
};

export const getColorGradient = (start: string, end: string, steps: number): string[] => {
  if (steps <= 1) return [start];
  return chroma.scale([start, end]).mode('lab').colors(steps);
};

export const brightenColor = (value: string, amount: number): string => {
  return chroma(value).brighten(amount).hex();
};
