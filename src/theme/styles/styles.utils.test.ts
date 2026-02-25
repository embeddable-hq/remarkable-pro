import type { Dimension, Measure } from '@embeddable.com/core';
import { getObjectStableKey } from '../../utils/object.utils';
import { injectCssVariables, getColor, getDimensionMeasureColor } from './styles.utils';
import type { Theme } from '../theme.types';

vi.mock('../../utils/object.utils', () => ({
  getObjectStableKey: vi.fn().mockReturnValue('theme-hash'),
}));

// -- helpers -----------------------------------------------------------------

const makeTheme = (charts: Record<string, unknown> = {}): Theme => ({ charts }) as unknown as Theme;

const makeMeasure = (inputColor?: string): Measure =>
  ({ __type__: 'measure', inputs: inputColor ? { color: inputColor } : {} }) as unknown as Measure;

const makeDimension = (inputColor?: string): Dimension =>
  ({
    __type__: 'dimension',
    inputs: inputColor ? { color: inputColor } : {},
  }) as unknown as Dimension;

// ----------------------------------------------------------------------------

describe('injectCssVariables', () => {
  beforeEach(() => {
    document.getElementById('remarkable-ui-embeddable-style')?.remove();
  });

  it('creates a style element with CSS variables wrapped in :root', () => {
    injectCssVariables({ '--color': 'red', '--size': '16px' });
    const el = document.getElementById('remarkable-ui-embeddable-style') as HTMLStyleElement;
    expect(el).not.toBeNull();
    expect(el.textContent).toMatch(/^:root \{/);
    expect(el.textContent).toContain('--color: red;');
    expect(el.textContent).toContain('--size: 16px;');
  });

  it('overwrites an existing style element rather than creating a new one', () => {
    injectCssVariables({ '--old': 'blue' });
    injectCssVariables({ '--new': 'green' });
    const elements = document.querySelectorAll('#remarkable-ui-embeddable-style');
    expect(elements).toHaveLength(1);
    expect(elements[0].textContent).toContain('--new: green;');
    expect(elements[0].textContent).not.toContain('--old');
  });

  it('returns a cleanup function that removes the style element', () => {
    const cleanup = injectCssVariables({ '--color': 'red' });
    expect(document.getElementById('remarkable-ui-embeddable-style')).not.toBeNull();
    cleanup();
    expect(document.getElementById('remarkable-ui-embeddable-style')).toBeNull();
  });

  it('handles an empty styles object', () => {
    injectCssVariables({});
    const el = document.getElementById('remarkable-ui-embeddable-style') as HTMLStyleElement;
    expect(el.textContent).toBe(':root {\n}');
  });
});

// ----------------------------------------------------------------------------

describe('getColor', () => {
  // Each test uses a unique key to avoid colorsMap state leaking between tests.

  it('returns the palette color at the given index', () => {
    expect(getColor('gc-key-a', 'val1', ['red', 'green', 'blue'], 0)).toBe('red');
    expect(getColor('gc-key-b', 'val1', ['red', 'green', 'blue'], 2)).toBe('blue');
  });

  it('returns the cached color on repeated calls regardless of a changed index', () => {
    const first = getColor('gc-key-c', 'val1', ['red', 'green'], 0);
    const second = getColor('gc-key-c', 'val1', ['red', 'green'], 1); // idx ignored – cached
    expect(first).toBe(second);
    expect(first).toBe('red');
  });

  it('cycles through the palette using modulo when index exceeds palette length', () => {
    expect(getColor('gc-key-d', 'val1', ['red', 'green'], 3)).toBe('green'); // 3 % 2 = 1
  });

  it('persists assigned colors to sessionStorage', () => {
    getColor('gc-key-e', 'val1', ['purple'], 0);
    const stored = JSON.parse(sessionStorage.getItem('embeddable') ?? '{}');
    expect(stored['gc-key-e']['val1']).toBe('purple');
  });

  it('throws when the palette is empty', () => {
    expect(() => getColor('gc-key-f', 'val1', [], 0)).toThrow('No valid color found in palette');
  });
});

// ----------------------------------------------------------------------------

describe('getDimensionMeasureColor', () => {
  const chartColors = ['#chart-0', '#chart-1', '#chart-2'];

  describe('priority 1: inputs.color', () => {
    it('returns inputs.color for a measure', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure('#input-measure'),
        theme: makeTheme(),
        value: 'Sales',
        color: 'background',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#input-measure');
    });

    it('returns inputs.color for a dimension', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeDimension('#input-dim'),
        theme: makeTheme(),
        value: 'US',
        color: 'background',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#input-dim');
    });
  });

  describe('priority 2: theme colorMap', () => {
    it('returns backgroundColorMap entry for a measure', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ backgroundColorMap: { measure: { Sales: '#bg-sales' } } }),
        value: 'Sales',
        color: 'background',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#bg-sales');
    });

    it('returns backgroundColorMap entry for a dimension value', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeDimension(),
        theme: makeTheme({ backgroundColorMap: { dimensionValue: { US: '#bg-us' } } }),
        value: 'US',
        color: 'background',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#bg-us');
    });

    it('falls back to borderColorMap when no backgroundColorMap entry (background request)', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ borderColorMap: { measure: { Revenue: '#border-revenue' } } }),
        value: 'Revenue',
        color: 'background',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#border-revenue');
    });

    it('returns borderColorMap entry for a border request', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ borderColorMap: { measure: { Count: '#border-count' } } }),
        value: 'Count',
        color: 'border',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#border-count');
    });

    it('falls back to backgroundColorMap when no borderColorMap entry (border request)', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ backgroundColorMap: { measure: { Qty: '#bg-qty' } } }),
        value: 'Qty',
        color: 'border',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#bg-qty');
    });
  });

  describe('priority 3: palette fallback', () => {
    beforeEach(() => {
      // Ensure a predictable themeKey across all palette-fallback tests.
      vi.mocked(getObjectStableKey).mockReturnValue('theme-hash');
    });

    it('uses theme backgroundColors at the given index', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ backgroundColors: ['#theme-bg-0', '#theme-bg-1'] }),
        value: 'palette-bg-1',
        color: 'background',
        index: 1,
        chartColors,
      });
      expect(result).toBe('#theme-bg-1');
    });

    it('uses theme borderColors for a border request', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme({ borderColors: ['#theme-border-0', '#theme-border-1'] }),
        value: 'palette-border-1',
        color: 'border',
        index: 0,
        chartColors,
      });
      expect(result).toBe('#theme-border-0');
    });

    it('falls back to chartColors when the theme has no palette', () => {
      const result = getDimensionMeasureColor({
        dimensionOrMeasure: makeMeasure(),
        theme: makeTheme(),
        value: 'palette-chart-1',
        color: 'background',
        index: 2,
        chartColors,
      });
      expect(result).toBe('#chart-2');
    });
  });
});
