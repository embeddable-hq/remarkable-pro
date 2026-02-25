import {
  getPivotMeasures,
  getPivotDimension,
  getPivotColumnTotalsFor,
  getPivotRowTotalsFor,
} from './PivotPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

/* eslint-disable @typescript-eslint/no-explicit-any */

const makeFormatter = (overrides: Record<string, any> = {}) => ({
  dimensionOrMeasureTitle: vi.fn((d: any) => `title:${d.name}`),
  data: vi.fn((d: any, v: any) => `fmt:${v}`),
  ...overrides,
});

const measure = (overrides: Record<string, any> = {}): any => ({
  name: 'myMeasure',
  title: 'My Measure',
  nativeType: 'number',
  ...overrides,
});

const dimension = (overrides: Record<string, any> = {}): any => ({
  name: 'myDim',
  title: 'My Dim',
  nativeType: 'string',
  ...overrides,
});

const mockTheme = {} as any;

beforeEach(() => {
  vi.mocked(getThemeFormatter).mockReset();
});

// ---------------------------------------------------------------------------

describe('getPivotMeasures', () => {
  it('returns key and label from measure name and themeFormatter', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

    expect(result.key).toBe('myMeasure');
    expect(result.label).toBe('title:myMeasure');
    expect(fmt.dimensionOrMeasureTitle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'myMeasure' }),
    );
  });

  it('sets showAsPercentage to true when inputs.showAsPercentage is truthy', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures(
      { measures: [measure({ inputs: { showAsPercentage: true } })] },
      mockTheme,
    )!;

    expect(result.showAsPercentage).toBe(true);
  });

  it('sets showAsPercentage to false when inputs.showAsPercentage is absent', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

    expect(result.showAsPercentage).toBe(false);
  });

  it('uses inputs.decimalPlaces for percentageDecimalPlaces', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures(
      { measures: [measure({ inputs: { decimalPlaces: 3 } })] },
      mockTheme,
    )!;

    expect(result.percentageDecimalPlaces).toBe(3);
  });

  it('defaults percentageDecimalPlaces to 1 when decimalPlaces is absent', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

    expect(result.percentageDecimalPlaces).toBe(1);
  });

  describe('accessor', () => {
    it('returns displayNullAs when row value is null', () => {
      vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

      const [result] = getPivotMeasures(
        { measures: [measure()], displayNullAs: 'N/A' },
        mockTheme,
      )!;

      expect(result.accessor!({ myMeasure: null })).toBe('N/A');
    });

    it('returns displayNullAs when row value is undefined', () => {
      vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

      const [result] = getPivotMeasures({ measures: [measure()], displayNullAs: '-' }, mockTheme)!;

      expect(result.accessor!({ myMeasure: undefined })).toBe('-');
    });

    it('returns formatted value via themeFormatter.data when value is present', () => {
      const fmt = makeFormatter();
      vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

      const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

      expect(result.accessor!({ myMeasure: 42 })).toBe('fmt:42');
      expect(fmt.data).toHaveBeenCalledWith(expect.objectContaining({ name: 'myMeasure' }), 42);
    });
  });

  it('maps multiple measures independently', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const results = getPivotMeasures(
      { measures: [measure({ name: 'a' }), measure({ name: 'b' })] },
      mockTheme,
    )!;

    expect(results).toHaveLength(2);
    expect(results[0].key).toBe('a');
    expect(results[1].key).toBe('b');
  });
});

// ---------------------------------------------------------------------------

describe('getPivotDimension', () => {
  it('returns key from dimension name', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getPivotDimension({ dimension: dimension() }, mockTheme);

    expect(result.key).toBe('myDim');
  });

  it('returns label from themeFormatter.dimensionOrMeasureTitle', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getPivotDimension({ dimension: dimension() }, mockTheme);

    expect(result.label).toBe('title:myDim');
  });

  it('formatValue delegates to themeFormatter.data', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const result = getPivotDimension({ dimension: dimension() }, mockTheme);
    const formatted = result.formatValue!('raw-value');

    expect(fmt.data).toHaveBeenCalledWith(expect.objectContaining({ name: 'myDim' }), 'raw-value');
    expect(formatted).toBe('fmt:raw-value');
  });
});

// ---------------------------------------------------------------------------

describe('getPivotColumnTotalsFor', () => {
  it('returns names of measures with showColumnTotal set', () => {
    const measures = [
      measure({ name: 'a', inputs: { showColumnTotal: true } }),
      measure({ name: 'b', inputs: { showColumnTotal: false } }),
      measure({ name: 'c', inputs: { showColumnTotal: true } }),
    ];

    expect(getPivotColumnTotalsFor(measures)).toEqual(['a', 'c']);
  });

  it('returns empty array when no measures have showColumnTotal', () => {
    expect(getPivotColumnTotalsFor([measure({ name: 'a' })])).toEqual([]);
  });

  it('returns empty array for empty measures list', () => {
    expect(getPivotColumnTotalsFor([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('getPivotRowTotalsFor', () => {
  it('returns names of measures with showRowTotal set', () => {
    const measures = [
      measure({ name: 'x', inputs: { showRowTotal: true } }),
      measure({ name: 'y', inputs: { showRowTotal: false } }),
      measure({ name: 'z', inputs: { showRowTotal: true } }),
    ];

    expect(getPivotRowTotalsFor(measures)).toEqual(['x', 'z']);
  });

  it('returns empty array when no measures have showRowTotal', () => {
    expect(getPivotRowTotalsFor([measure({ name: 'x' })])).toEqual([]);
  });

  it('returns empty array for empty measures list', () => {
    expect(getPivotRowTotalsFor([])).toEqual([]);
  });
});
