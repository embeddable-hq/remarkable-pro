import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { getLineChartProData, getLineChartProOptions } from './LineChartDefaultPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation } from '../../charts.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => []),
  getStyleNumber: vi.fn(() => 5),
}));
vi.mock('../../charts.utils', () => ({ getDimensionWithoutTruncation: vi.fn((d) => d) }));
vi.mock('../../../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(() => '#000'),
}));
vi.mock('../../../../utils/color.utils', () => ({
  isColorValid: vi.fn(() => false),
  setColorAlpha: vi.fn((c: string) => c),
}));
vi.mock('mergician', () => ({
  mergician: vi.fn((...args: object[]) => Object.assign({}, ...args)),
}));

// -- helpers -----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'date',
    title: 'Date',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as Dimension;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (overrides: Record<string, any> = {}): Measure =>
  ({
    name: 'revenue',
    title: 'Revenue',
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const makeTheme = (overrides = {}) => ({ charts: {}, ...overrides }) as never;

const makeMockFormatter = () => ({
  data: vi.fn((_: unknown, value: unknown) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: { title: string }) => m.title),
});

const makeChartData = (labels: string[], datasets: { data: number[] }[] = []) => ({
  labels,
  datasets,
});

// ----------------------------------------------------------------------------

describe('getLineChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
  });

  it('returns empty labels and datasets when data is undefined', () => {
    const result = getLineChartProData(
      {
        data: undefined as never,
        dimension: makeDimension(),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([{ data: [] }]);
  });

  it('maps labels from dimension name', () => {
    const result = getLineChartProData(
      {
        data: [{ date: 'Jan' }, { date: 'Feb' }],
        dimension: makeDimension({ name: 'date' }),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan', 'Feb']);
  });

  it('fills null for missing measure values when connectGaps is false', () => {
    const result = getLineChartProData(
      {
        data: [{ date: 'Jan', revenue: 100 }, { date: 'Feb' }],
        dimension: makeDimension({ name: 'date' }),
        measures: [makeMeasure({ name: 'revenue', inputs: { connectGaps: false } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result?.datasets?.[0]?.data).toEqual([100, null]);
  });

  it('fills zero for missing measure values when connectGaps is true', () => {
    const result = getLineChartProData(
      {
        data: [{ date: 'Jan', revenue: 100 }, { date: 'Feb' }],
        dimension: makeDimension({ name: 'date' }),
        measures: [makeMeasure({ name: 'revenue', inputs: { connectGaps: true } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result?.datasets?.[0]?.data).toEqual([100, 0]);
  });
});

// ----------------------------------------------------------------------------

describe('getLineChartProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionWithoutTruncation).mockImplementation((d) => d);
  });

  // -- datalabels.labels.value.formatter ---------------------------------------

  describe('plugins.datalabels.labels.value.formatter', () => {
    it('formats the value using the correct measure by datasetIndex', () => {
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [measure],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options.plugins!.datalabels!.labels as any)!.value!.formatter!(42, { datasetIndex: 0 });

      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 42);
    });

    it('returns the formatted value', () => {
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (options.plugins!.datalabels!.labels as any)!.value!.formatter!(99, {
        datasetIndex: 0,
      });

      expect(result).toBe('fmt:99');
    });
  });

  // -- tooltip.callbacks.title -------------------------------------------------

  describe('plugins.tooltip.callbacks.title', () => {
    it('passes label through getDimensionWithoutTruncation(dimension)', () => {
      const dimension = makeDimension({ name: 'date' });
      const options = getLineChartProOptions(
        {
          dimension,
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      options.plugins?.tooltip?.callbacks?.title?.call(
        {} as never,
        [{ label: 'Jan 2024' }] as never,
      );

      expect(getDimensionWithoutTruncation).toHaveBeenCalledWith(dimension);
      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'Jan 2024');
    });

    it('returns the formatted title', () => {
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      const result = options.plugins!.tooltip!.callbacks!.title!.call(
        {} as never,
        [{ label: 'March' }] as never,
      );

      expect(result).toBe('fmt:March');
    });
  });

  // -- tooltip.callbacks.label -------------------------------------------------

  describe('plugins.tooltip.callbacks.label', () => {
    it('formats raw value using the correct measure by datasetIndex', () => {
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [measure],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      options.plugins!.tooltip!.callbacks!.label!.call(
        {} as never,
        { datasetIndex: 0, raw: 500, dataset: { label: 'Revenue' } } as never,
      );

      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 500);
    });

    it('returns "datasetLabel: formattedValue" format', () => {
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure({ title: 'Revenue' })],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      const result = options.plugins!.tooltip!.callbacks!.label!.call(
        {} as never,
        { datasetIndex: 0, raw: 200, dataset: { label: 'Revenue' } } as never,
      );

      expect(result).toBe('Revenue: fmt:200');
    });
  });

  // -- scales.x.ticks.callback -------------------------------------------------

  describe('scales.x.ticks.callback', () => {
    it('formats the label from data.labels at the given numeric index using dimension', () => {
      const dimension = makeDimension({ name: 'date' });
      const data = makeChartData(['Jan', 'Feb', 'Mar']);
      const options = getLineChartProOptions(
        {
          dimension,
          measures: [makeMeasure()],
          data: data as never,
        },
        makeTheme(),
      );

      options.scales!.x!.ticks!.callback!.call({} as never, 1, 1, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'Feb');
    });

    it('returns undefined when data.labels is absent', () => {
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure()],
          data: {} as never,
        },
        makeTheme(),
      );

      const result = options.scales!.x!.ticks!.callback!.call({} as never, 0, 0, []);

      expect(result).toBeUndefined();
    });
  });

  // -- scales.y.ticks.callback -------------------------------------------------

  describe('scales.y.ticks.callback', () => {
    it('formats the value using measures[0]', () => {
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [measure],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      options.scales!.y!.ticks!.callback!.call({} as never, 1000, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 1000);
    });
  });

  // -- theme merge -------------------------------------------------------------

  describe('theme.charts.lineChartDefaultPro.options merge', () => {
    it('merges theme-level chart options into the result', () => {
      const theme = {
        charts: {
          lineChartDefaultPro: {
            options: { animation: false },
          },
        },
      } as never;

      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        theme,
      );

      expect((options as { animation?: unknown }).animation).toBe(false);
    });

    it('works without theme chart options defined', () => {
      const options = getLineChartProOptions(
        {
          dimension: makeDimension(),
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      expect(options.scales).toBeDefined();
    });
  });
});
