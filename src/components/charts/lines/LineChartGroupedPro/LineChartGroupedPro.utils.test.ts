import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { getLineChartGroupedProOptions } from './LineChartGroupedPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation } from '../../charts.utils';
vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));
vi.mock('../../charts.utils', () => ({
  getDimensionWithoutTruncation: vi.fn((d) => d),
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
});

const makeChartData = (
  labels: string[],
  datasets: { rawLabel?: string; data: number[] }[] = [],
) => ({ labels, datasets });

// ----------------------------------------------------------------------------

describe('getLineChartGroupedProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionWithoutTruncation).mockImplementation((d) => d);
  });

  // -- datalabels.labels.value.formatter ---------------------------------------

  describe('plugins.datalabels.labels.value.formatter', () => {
    it('formats the value using the measure', () => {
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure,
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options.plugins!.datalabels!.labels as any)!.value!.formatter!(42, {});

      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 42);
    });

    it('returns the formatted value', () => {
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (options.plugins!.datalabels!.labels as any)!.value!.formatter!(99, {});

      expect(result).toBe('fmt:99');
    });
  });

  // -- tooltip.callbacks.title -------------------------------------------------

  describe('plugins.tooltip.callbacks.title', () => {
    it('passes the label through getDimensionWithoutTruncation(dimension)', () => {
      const dimension = makeDimension({ name: 'date' });
      const options = getLineChartGroupedProOptions(
        {
          dimension,
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
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
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
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
    it('formats the rawLabel using groupDimension and the raw value using the measure', () => {
      const groupDimension = makeDimension({ name: 'region' });
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension,
          measure,
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      options.plugins!.tooltip!.callbacks!.label!.call(
        {} as never,
        {
          raw: 200,
          dataset: { rawLabel: 'North' },
        } as never,
      );

      expect(getDimensionWithoutTruncation).toHaveBeenCalledWith(groupDimension);
      expect(mockFormatter.data).toHaveBeenCalledWith(groupDimension, 'North');
      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 200);
    });

    it('returns "groupLabel: measureValue" format', () => {
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      const result = options.plugins!.tooltip!.callbacks!.label!.call(
        {} as never,
        {
          raw: 500,
          dataset: { rawLabel: 'East' },
        } as never,
      );

      expect(result).toBe('fmt:East: fmt:500');
    });
  });

  // -- scales.x.ticks.callback -------------------------------------------------

  describe('scales.x.ticks.callback', () => {
    it('formats the label from data.labels at the given numeric index using dimension', () => {
      const dimension = makeDimension({ name: 'date' });
      const data = makeChartData(['Jan', 'Feb', 'Mar']);
      const options = getLineChartGroupedProOptions(
        {
          dimension,
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
          data: data as never,
        },
        makeTheme(),
      );

      options.scales!.x!.ticks!.callback!.call({} as never, 1, 1, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'Feb');
    });

    it('returns undefined when data.labels is absent', () => {
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
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
    it('formats the value using the measure', () => {
      const measure = makeMeasure({ name: 'revenue' });
      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure,
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      options.scales!.y!.ticks!.callback!.call({} as never, 1000, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(measure, 1000);
    });
  });

  // -- theme merge -------------------------------------------------------------

  describe('theme.charts.lineChartGroupedPro.options merge', () => {
    it('merges theme-level chart options into the result', () => {
      const theme = {
        charts: {
          lineChartGroupedPro: {
            options: { animation: false },
          },
        },
      } as never;

      const options = getLineChartGroupedProOptions(
        {
          dimension: makeDimension(),
          groupDimension: makeDimension({ name: 'region' }),
          measure: makeMeasure(),
          data: makeChartData([]) as never,
        },
        theme,
      );

      expect((options as { animation?: unknown }).animation).toBe(false);
    });
  });
});
