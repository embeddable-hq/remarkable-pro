import { Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../theme.types';
import { getObjectStableKey } from '../../utils/object.utils';

const generateCssVariables = (variables: Record<string, string>) => {
  let textContent = '';
  Object.keys(variables).forEach((key) => {
    const value = variables[key];
    textContent += `${key}: ${value};\n`;
  });
  return textContent;
};

// TODO: check the possibility of injecting via CSS (future)
export const injectCssVariables = (styles: Record<string, string>) => {
  const css = `:root {\n${generateCssVariables(styles)}}`;
  const styleId = 'remarkable-ui-embeddable-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (styleEl) {
    // Overwrite the old vars
    styleEl.textContent = css;
  } else {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  return () => styleEl?.remove();
};

const colorsMap = new Map<string, Map<string, string>>();
const colorsInUse = new Map<string, Set<string>>();

/* 
We save the colors to session storage so that they are persistent across refreshes. 
This is important, for example, if the user is looking at multiple tabs, or if the user refreshes the page.
*/
const STORAGE_KEY = 'embeddable';

const saveColorsMap = () => {
  const obj: Record<string, Record<string, string>> = {};
  for (const [cat, m] of colorsMap) {
    obj[cat] = Object.fromEntries(m);
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
};

const loadColorMap = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const data = sessionStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const obj: Record<string, Record<string, string>> = JSON.parse(data);
  for (const cat in obj) {
    const m = new Map(Object.entries(obj[cat] ?? {}));
    colorsMap.set(cat, m);
    colorsInUse.set(cat, new Set(m.values()));
  }
};

loadColorMap();

export const getColor = (key: string, value: string, palette: string[], idx: number): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';

  // Initialize structures if needed
  if (!colorsMap.has(key)) {
    colorsMap.set(key, new Map());
    colorsInUse.set(key, new Set());
  }

  const catMap = colorsMap.get(key)!;

  // Return existing color if already assigned
  if (catMap.has(value)) return catMap.get(value)!;

  // Find first colorsInUse color, fallback to indexed one
  const color = palette[idx % palette.length];

  if (typeof color !== 'string') {
    throw new Error('No valid color found in palette');
  }

  // Save mapping and mark as colorsInUse
  catMap.set(value, color);
  saveColorsMap();

  return color;
};

export type GetDimensionMeasureColorProps = {
  dimensionOrMeasure: Dimension | Measure;
  theme: Theme;
  value: string;
  color: 'background' | 'border';
  index: number;
  chartColors: string[];
  // Colors already taken in this chart. When passed, the returned color is added to it and
  // a cached palette color that clashes is swapped for a free one (not persisted).
  // Input/theme colors are never swapped.
  usedColors?: Set<string>;
};

export const getDimensionMeasureColor = ({
  dimensionOrMeasure,
  theme,
  color,
  value,
  index,
  chartColors,
  usedColors,
}: GetDimensionMeasureColorProps) => {
  const resolved = resolveDimensionMeasureColor({
    dimensionOrMeasure,
    theme,
    color,
    value,
    index,
    chartColors,
  });
  if (!usedColors) return resolved.color;

  if (resolved.fromPalette && usedColors.has(resolved.color)) {
    const freeColor = resolved.palette.find((c) => !usedColors.has(c));
    if (freeColor) resolved.color = freeColor;
  }

  usedColors.add(resolved.color);
  return resolved.color;
};

const resolveDimensionMeasureColor = ({
  dimensionOrMeasure,
  theme,
  color,
  value,
  index,
  chartColors,
}: Omit<GetDimensionMeasureColorProps, 'usedColors'>): {
  color: string;
  fromPalette: boolean;
  palette: string[];
} => {
  // 1) Color from inputs
  const inputColor = dimensionOrMeasure.inputs?.color;
  if (inputColor) return { color: inputColor, fromPalette: false, palette: [] };

  // 2) Color from theme (entity-specific)
  const entity = dimensionOrMeasure.__type__ === 'measure' ? 'measure' : 'dimensionValue';
  const backgroundColor = theme.charts['backgroundColorMap']?.[entity]?.[value];
  const borderColor = theme.charts['borderColorMap']?.[entity]?.[value];

  if (color === 'background') {
    if (backgroundColor) return { color: backgroundColor, fromPalette: false, palette: [] };
    if (borderColor) return { color: borderColor, fromPalette: false, palette: [] }; // fallback to border
  }

  if (color === 'border') {
    if (borderColor) return { color: borderColor, fromPalette: false, palette: [] };
    if (backgroundColor) return { color: backgroundColor, fromPalette: false, palette: [] }; // fallback to background
  }

  // 3) Palette fallback (theme palette -> provided palette)
  const themeKey = getObjectStableKey(theme);
  const paletteKey = color === 'background' ? 'backgroundColors' : 'borderColors';
  const key = `${themeKey}.charts.${paletteKey}`;

  // Fallback to chartColors
  const palette = theme.charts?.[paletteKey] ?? theme.charts.backgroundColors ?? chartColors;

  return { color: getColor(key, value, palette, index), fromPalette: true, palette };
};
