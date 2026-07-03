import {
  getPivotMeasures,
  getPivotDimension,
  getPivotColumnAggregationsFor,
  getPivotRowAggregationsFor,
} from './PivotPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

/* eslint-disable @typescript-eslint/no-explicit-any */

const makeFormatter = (overrides: Record<string, any> = {}) => ({
  dimensionOrMeasureTitle: vi.fn((d: any) => `title:${d.name}`),
  data: vi.fn((_d: any, v: any) => `fmt:${v}`),
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

    expect(result?.key).toBe('myMeasure');
    expect(result?.label).toBe('title:myMeasure');
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

    expect(result?.showAsPercentage).toBe(true);
  });

  it('sets showAsPercentage to false when inputs.showAsPercentage is absent', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

    expect(result?.showAsPercentage).toBe(false);
  });

  it('uses inputs.decimalPlaces for percentageDecimalPlaces', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures(
      { measures: [measure({ inputs: { decimalPlaces: 3 } })] },
      mockTheme,
    )!;

    expect(result?.percentageDecimalPlaces).toBe(3);
  });

  it('defaults percentageDecimalPlaces to 1 when decimalPlaces is absent', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

    expect(result?.percentageDecimalPlaces).toBe(1);
  });

  describe('accessor', () => {
    it('returns displayNullAs when row value is null', () => {
      vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

      const [result] = getPivotMeasures(
        { measures: [measure()], displayNullAs: 'N/A' },
        mockTheme,
      )!;

      expect(result?.accessor!({ myMeasure: null })).toBe('N/A');
    });

    it('returns displayNullAs when row value is undefined', () => {
      vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

      const [result] = getPivotMeasures({ measures: [measure()], displayNullAs: '-' }, mockTheme)!;

      expect(result?.accessor!({ myMeasure: undefined })).toBe('-');
    });

    it('returns formatted value via themeFormatter.data when value is present', () => {
      const fmt = makeFormatter();
      vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

      const [result] = getPivotMeasures({ measures: [measure()] }, mockTheme)!;

      expect(result?.accessor!({ myMeasure: 42 })).toBe('fmt:42');
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
    expect(results[0]!.key).toBe('a');
    expect(results[1]!.key).toBe('b');
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

describe('getPivotColumnAggregationsFor', () => {
  it('maps columnAggregation values to the correct prop keys', () => {
    const measures = [
      measure({ name: 'a', inputs: { columnAggregation: ['sum', 'min'] } }),
      measure({ name: 'b', inputs: { columnAggregation: ['max'] } }),
      measure({ name: 'c', inputs: { columnAggregation: ['average', 'sum'] } }),
    ];

    const result = getPivotColumnAggregationsFor(measures);

    expect(result.columnSumFor).toEqual(['a', 'c']);
    expect(result.columnMinFor).toEqual(['a']);
    expect(result.columnMaxFor).toEqual(['b']);
    expect(result.columnAverageFor).toEqual(['c']);
  });

  it('returns empty arrays when no measures have columnAggregation', () => {
    const result = getPivotColumnAggregationsFor([measure({ name: 'a' })]);

    expect(result.columnSumFor).toEqual([]);
    expect(result.columnMinFor).toEqual([]);
    expect(result.columnMaxFor).toEqual([]);
    expect(result.columnAverageFor).toEqual([]);
  });

  it('returns empty arrays for empty measures list', () => {
    const result = getPivotColumnAggregationsFor([]);

    expect(result.columnSumFor).toEqual([]);
    expect(result.columnMinFor).toEqual([]);
    expect(result.columnMaxFor).toEqual([]);
    expect(result.columnAverageFor).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('getPivotRowAggregationsFor', () => {
  it('maps rowAggregation values to the correct prop keys', () => {
    const measures = [
      measure({ name: 'x', inputs: { rowAggregation: ['sum', 'average'] } }),
      measure({ name: 'y', inputs: { rowAggregation: ['min'] } }),
      measure({ name: 'z', inputs: { rowAggregation: ['max', 'sum'] } }),
    ];

    const result = getPivotRowAggregationsFor(measures);

    expect(result.rowSumFor).toEqual(['x', 'z']);
    expect(result.rowMinFor).toEqual(['y']);
    expect(result.rowMaxFor).toEqual(['z']);
    expect(result.rowAverageFor).toEqual(['x']);
  });

  it('returns empty arrays when no measures have rowAggregation', () => {
    const result = getPivotRowAggregationsFor([measure({ name: 'x' })]);

    expect(result.rowSumFor).toEqual([]);
    expect(result.rowMinFor).toEqual([]);
    expect(result.rowMaxFor).toEqual([]);
    expect(result.rowAverageFor).toEqual([]);
  });

  it('returns empty arrays for empty measures list', () => {
    const result = getPivotRowAggregationsFor([]);

    expect(result.rowSumFor).toEqual([]);
    expect(result.rowMinFor).toEqual([]);
    expect(result.rowMaxFor).toEqual([]);
    expect(result.rowAverageFor).toEqual([]);
  });
});
