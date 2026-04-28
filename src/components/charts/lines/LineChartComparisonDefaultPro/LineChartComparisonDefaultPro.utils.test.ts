import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import type { ChartData } from 'chart.js';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  createComparisonClickHandler,
  getLineChartComparisonProOptions,
} from './LineChartComparisonDefaultPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation } from '../../charts.utils';

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(),
}));
vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => []),
  getChartjsAxisOptionsScalesTicksDefault: vi.fn(() => ({})),
  getChartjsAxisOptionsScalesTitle: vi.fn(() => ({})),
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
vi.mock('../../../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn((k: string) => k) } }));

// -- helpers -----------------------------------------------------------------

const makeClickDimension = (nativeType = 'string'): Dimension =>
  ({ name: 'date', nativeType, inputs: {} }) as unknown as Dimension;

const makeClick = (index: number, datasetIndex = 0): ChartClickArgs =>
  ({ elementAtEvent: [{ index, datasetIndex }] }) as unknown as ChartClickArgs;

const noClick = (): ChartClickArgs => ({ elementAtEvent: [] }) as unknown as ChartClickArgs;

const makeClickChartData = (
  labels: string[],
  datasets: { labels?: string[] }[] = [],
): ChartData<'line'> => ({ labels, datasets }) as unknown as ChartData<'line'>;

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

const makeChartData = (
  labels: string[],
  datasets: { xAxisID?: string; labels?: string[]; data: number[] }[] = [],
) => ({ labels, datasets });

// ----------------------------------------------------------------------------

describe('createComparisonClickHandler', () => {
  const mockGetTimeRange = vi.mocked(getTimeRangeFromDimensionValue);

  beforeEach(() => {
    mockGetTimeRange.mockReset();
    mockGetTimeRange.mockReturnValue(undefined);
  });

  it('does not call onClicked when elementAtEvent is empty', () => {
    const onClicked = vi.fn();
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['2024-01-01']),
      measures: [makeMeasure()],
      dimension: makeClickDimension('time'),
      onClicked,
    });

    handler(noClick());

    expect(onClicked).not.toHaveBeenCalled();
  });

  it('reads dimensionValue from data.labels for a non-comparison dataset', () => {
    const onClicked = vi.fn();
    const measures = [makeMeasure()];
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['Jan', 'Feb', 'Mar']),
      measures,
      dimension: makeClickDimension('time'),
      onClicked,
    });

    // datasetIndex 0 < measures.length (1) → not a comparison period
    handler(makeClick(1, 0));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: 'Feb' }));
  });

  it('reads dimensionValue from dataset.labels for a comparison period with time dimension', () => {
    const onClicked = vi.fn();
    const measures = [makeMeasure()];
    const comparisonDataset = { labels: ['2023-Jan', '2023-Feb', '2023-Mar'] };
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['Jan', 'Feb', 'Mar'], [{}, comparisonDataset]),
      measures,
      dimension: makeClickDimension('time'),
      onClicked,
    });

    // datasetIndex 1 >= measures.length (1) → comparison period, nativeType is time
    handler(makeClick(2, 1));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: '2023-Mar' }));
  });

  it('reads dimensionValue from data.labels for a comparison period with non-time dimension', () => {
    const onClicked = vi.fn();
    const measures = [makeMeasure()];
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['US', 'UK', 'DE'], [{}, {}]),
      measures,
      dimension: makeClickDimension('string'),
      onClicked,
    });

    // datasetIndex 1 >= measures.length (1) → comparison period, but NOT time
    handler(makeClick(0, 1));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: 'US' }));
  });

  it('passes value, dimension and granularity to getTimeRangeFromDimensionValue', () => {
    const dimension = makeClickDimension('time');
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['2024-01-01', '2024-02-01']),
      measures: [makeMeasure()],
      dimension,
      granularity: 'month',
      onClicked: vi.fn(),
    });

    handler(makeClick(1, 0));

    expect(mockGetTimeRange).toHaveBeenCalledWith({
      value: '2024-02-01',
      stateGranularity: 'month',
      dimension,
    });
  });

  it('calls onClicked with the dimensionTimeRange returned by getTimeRangeFromDimensionValue', () => {
    const onClicked = vi.fn();
    const fakeRange = { from: new Date('2024-01-01'), to: new Date('2024-01-31') };
    mockGetTimeRange.mockReturnValue(fakeRange as never);

    const handler = createComparisonClickHandler({
      data: makeClickChartData(['2024-01-01']),
      measures: [makeMeasure()],
      dimension: makeClickDimension('time'),
      onClicked,
    });

    handler(makeClick(0));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({ dimensionTimeRange: fakeRange }),
    );
  });

  it('does not throw when onClicked is undefined', () => {
    const handler = createComparisonClickHandler({
      data: makeClickChartData(['A']),
      measures: [makeMeasure()],
      dimension: makeClickDimension(),
    });

    expect(() => handler(makeClick(0))).not.toThrow();
  });
});

describe('getLineChartComparisonProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionWithoutTruncation).mockImplementation((d) => d);
  });

  // -- dimension.nativeType branch ---------------------------------------------

  describe('dimension.nativeType branch', () => {
    it('uses time options when nativeType is "time" — comparisonAxis has ticks', () => {
      const options = getLineChartComparisonProOptions(
        {
          dimension: makeDimension({ nativeType: 'time' }),
          measures: [makeMeasure()],
          data: makeChartData(
            ['2024-01', '2024-02'],
            [
              { xAxisID: 'mainAxis', labels: ['2024-01', '2024-02'], data: [100, 200] },
              { xAxisID: 'comparisonAxis', labels: ['2023-01', '2023-02'], data: [90, 180] },
            ],
          ) as never,
        },
        makeTheme(),
      );

      expect(options.scales?.['comparisonAxis']?.ticks).toBeDefined();
    });

    it('uses non-time options when nativeType is not "time" — comparisonAxis has no ticks', () => {
      const options = getLineChartComparisonProOptions(
        {
          dimension: makeDimension({ nativeType: 'string' }),
          measures: [makeMeasure()],
          data: makeChartData(['A', 'B']) as never,
        },
        makeTheme(),
      );

      expect(options.scales?.['comparisonAxis']?.ticks).toBeUndefined();
    });

    it('non-time path sets comparisonAxis display to false', () => {
      const options = getLineChartComparisonProOptions(
        {
          dimension: makeDimension({ nativeType: 'number' }),
          measures: [makeMeasure()],
          data: makeChartData([]) as never,
        },
        makeTheme(),
      );

      expect(options.scales?.['comparisonAxis']?.display).toBe(false);
    });
  });

  // -- theme merge -------------------------------------------------------------

  describe('theme.charts.lineChartComparisonDefaultPro.options merge', () => {
    it('merges theme-level chart options into the result', () => {
      const theme = {
        charts: {
          lineChartComparisonDefaultPro: {
            options: { animation: false },
          },
        },
      } as never;

      const options = getLineChartComparisonProOptions(
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
      const options = getLineChartComparisonProOptions(
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
