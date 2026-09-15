import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from './LineChartGroupedPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation, groupTailAsOtherPerGroup } from '../../charts.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { setColorAlpha } from '../../../../utils/color.utils';
import { i18n } from '../../../../theme/i18n/i18n';
vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));
vi.mock('../../charts.utils', () => ({
  getDimensionWithoutTruncation: vi.fn((d) => d),
  groupTailAsOtherPerGroup: vi.fn((data) => data ?? []),
}));
vi.mock('../../../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(() => '#000'),
}));
vi.mock('../../../../utils/color.utils', () => ({ setColorAlpha: vi.fn((color) => color) }));
vi.mock('../../../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn(() => 'Other') } }));

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

describe('getLineChartGroupedProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;
  let dimension: Dimension;
  let groupDimension: Dimension;
  let measure: Measure;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionMeasureColor).mockReturnValue('#000');
    vi.mocked(setColorAlpha).mockImplementation((color) => color);
    vi.mocked(i18n.t).mockReturnValue('Other');
    vi.mocked(groupTailAsOtherPerGroup).mockImplementation((data) => data ?? []);

    dimension = makeDimension({ name: 'date' });
    groupDimension = makeDimension({ name: 'group' });
    measure = makeMeasure({ name: 'revenue' });
  });

  it('passes dimension, groupDimension, measure and maxItems through to groupTailAsOtherPerGroup', () => {
    const data = [{ date: 'A', group: 'g1', revenue: 1 }];

    getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false, maxItems: 5 },
      makeTheme(),
    );

    expect(groupTailAsOtherPerGroup).toHaveBeenCalledWith(
      data,
      dimension,
      groupDimension,
      measure,
      5,
    );
  });

  it('sorts axis labels alphabetically', () => {
    const data = [
      { date: 'C', group: 'g1', revenue: 3 },
      { date: 'A', group: 'g1', revenue: 1 },
      { date: 'B', group: 'g1', revenue: 2 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['A', 'B', 'C']);
  });

  it('pins the "Other" axis label to the end instead of sorting it alphabetically', () => {
    const data = [
      { date: 'Other', group: 'g1', revenue: 99 },
      { date: 'B', group: 'g1', revenue: 2 },
      { date: 'A', group: 'g1', revenue: 1 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['A', 'B', 'Other']);
  });

  it('gives every group its own point for the "Other" axis bucket', () => {
    const data = [
      { date: 'Other', group: 'g1', revenue: 5 },
      { date: 'Other', group: 'g2', revenue: 50 },
      { date: 'A', group: 'g1', revenue: 1 },
      { date: 'A', group: 'g2', revenue: 10 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['A', 'Other']);
    const g1Dataset = result.datasets.find((d) => (d as { rawLabel?: string }).rawLabel === 'g1');
    const g2Dataset = result.datasets.find((d) => (d as { rawLabel?: string }).rawLabel === 'g2');
    expect(g1Dataset?.data).toEqual([1, 5]);
    expect(g2Dataset?.data).toEqual([10, 50]);
  });
});

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
