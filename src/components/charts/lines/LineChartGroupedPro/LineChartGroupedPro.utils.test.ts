import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from './LineChartGroupedPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { setColorAlpha } from '../../../../utils/color.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { getLineChartProOptionsOnClick } from '../lines.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('../../../../utils/color.utils', () => ({ setColorAlpha: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));
vi.mock('../lines.utils', () => ({ getLineChartProOptionsOnClick: vi.fn() }));
vi.mock('mergician', () => ({
  mergician: vi.fn((...args: object[]) => Object.assign({}, ...args)),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  data: vi.fn((_, value) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: Measure) => m.title ?? m.name),
});

// ---------------------------------------------------------------------------

describe('getLineChartGroupedProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
    vi.mocked(setColorAlpha).mockImplementation((color) => `${color}-alpha`);
  });

  it('returns sorted axis labels from the dimension column', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [
      { date: 'Feb', region: 'North', revenue: 20 },
      { date: 'Jan', region: 'North', revenue: 10 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Feb', 'Jan']);
  });

  it('creates one dataset per unique group value', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [
      { date: 'Jan', region: 'North', revenue: 10 },
      { date: 'Jan', region: 'South', revenue: 20 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(2);
  });

  it('formats dataset labels via themeFormatter.data when disableFormatting is not set', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ date: 'Jan', region: 'North', revenue: 10 }];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.datasets[0]?.label).toBe('fmt:North');
  });

  it('uses raw group value as label when disableFormatting.chart.labels is true', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ date: 'Jan', region: 'North', revenue: 10 }];
    const theme = makeTheme({ disableFormatting: { chart: { labels: true } } });

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      theme,
    );

    expect(result.datasets[0]?.label).toBe('North');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('stores the raw group value in rawLabel on each dataset', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ date: 'Jan', region: 'South', revenue: 5 }];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect((result.datasets[0] as { rawLabel?: string })?.rawLabel).toBe('South');
  });

  it('maps measure values correctly per axis point, filling null for missing records', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue', inputs: { connectGaps: false } });
    const data = [
      { date: 'Jan', region: 'North', revenue: 10 },
      { date: 'Feb', region: 'North', revenue: 20 },
      { date: 'Feb', region: 'South', revenue: 30 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    // groupBy preserves insertion order: North=datasets[0], South=datasets[1]
    // axis is sorted alphabetically: ['Feb', 'Jan']
    expect(result.datasets[0]?.data).toEqual([20, 10]);
    expect(result.datasets[1]?.data).toEqual([30, null]);
  });

  it('fills 0 for missing records when connectGaps is true', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue', inputs: { connectGaps: true } });
    const data = [
      { date: 'Jan', region: 'North', revenue: 10 },
      { date: 'Feb', region: 'South', revenue: 30 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    // groupBy insertion order: North=datasets[0], South=datasets[1]
    // axis sorted: ['Feb', 'Jan'] — South missing Jan → 0
    expect(result.datasets[1]?.data).toEqual([30, 0]);
  });

  it('passes hasMinMaxYAxisRange as the clip property on each dataset', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ date: 'Jan', region: 'North', revenue: 10 }];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: true },
      makeTheme(),
    );

    expect(result.datasets[0]?.clip).toBe(true);
  });

  it('filters out null dimension values from the axis', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [
      { date: null, region: 'North', revenue: 5 },
      { date: 'Jan', region: 'North', revenue: 10 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan']);
  });

  it('filters out null group values from datasets', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [
      { date: 'Jan', region: null, revenue: 5 },
      { date: 'Jan', region: 'North', revenue: 10 },
    ];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(1);
    expect((result.datasets[0] as { rawLabel?: string })?.rawLabel).toBe('North');
  });

  it('returns empty labels and datasets when data is empty', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue' });

    const result = getLineChartGroupedProData(
      { data: [], dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([]);
  });

  it('sets fill from measure.inputs.fillUnderLine', () => {
    const dimension = makeDimension({ name: 'date' });
    const groupDimension = makeDimension({ name: 'region' });
    const measure = makeMeasure({ name: 'revenue', inputs: { fillUnderLine: true } });
    const data = [{ date: 'Jan', region: 'North', revenue: 10 }];

    const result = getLineChartGroupedProData(
      { data, dimension, groupDimension, measure, hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.datasets[0]?.fill).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('getLineChartGroupedProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getLineChartProOptionsOnClick).mockReturnValue({});
  });

  const makeChartData = () => ({
    labels: ['Jan', 'Feb'],
    datasets: [],
  });

  it('formats datalabel values via themeFormatter.data', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      makeTheme(),
    );

    const formatter = options.plugins?.datalabels?.labels?.value?.formatter as (
      v: number,
    ) => string;
    expect(formatter(42)).toBe('fmt:42');
  });

  it('returns raw value for datalabels when disableFormatting.chart.datalabels is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { datalabels: true } } });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    const formatter = options.plugins?.datalabels?.labels?.value?.formatter as (
      v: number,
    ) => number;
    expect(formatter(99)).toBe(99);
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats tooltip title via themeFormatter.data', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      makeTheme(),
    );

    const title = options.plugins?.tooltip?.callbacks?.title as (ctx: object[]) => string;
    expect(title([{ label: 'Jan' }])).toBe('fmt:Jan');
  });

  it('returns raw label for tooltip title when disableFormatting.chart.tooltip is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { tooltip: true } } });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    const title = options.plugins?.tooltip?.callbacks?.title as (ctx: object[]) => string;
    expect(title([{ label: 'Mar' }])).toBe('Mar');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats tooltip label with dataset label and formatted value', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      makeTheme(),
    );

    const label = options.plugins?.tooltip?.callbacks?.label as (ctx: object) => string;
    expect(label({ raw: 100, dataset: { label: 'North' } })).toBe('North: fmt:100');
  });

  it('returns raw tooltip label when disableFormatting.chart.tooltip is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { tooltip: true } } });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    const label = options.plugins?.tooltip?.callbacks?.label as (ctx: object) => string;
    expect(label({ raw: 100, dataset: { label: 'South' } })).toBe('South: 100');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats x-axis tick via themeFormatter.data', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    // value 0 → labels[0] = 'Jan'
    expect(callback(0)).toBe('fmt:Jan');
  });

  it('returns raw label for x-axis tick when disableFormatting.chart.xAxis is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { xAxis: true } } });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    expect(callback(1)).toBe('Feb');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('returns undefined for x-axis tick when data has no labels', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: { datasets: [] } },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    expect(callback(0)).toBeUndefined();
  });

  it('formats y-axis tick via themeFormatter.data', () => {
    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.y?.ticks?.callback as any;
    expect(callback(500)).toBe('fmt:500');
  });

  it('returns raw value for y-axis tick when disableFormatting.chart.yAxis is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { yAxis: true } } });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.y?.ticks?.callback as any;
    expect(callback(42)).toBe(42);
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('merges in theme.charts.lineChartGroupedPro.options when present', () => {
    const theme = makeTheme({
      charts: { lineChartGroupedPro: { options: { animation: false } } },
    });

    const options = getLineChartGroupedProOptions(
      { dimension: makeDimension(), measure: makeMeasure(), data: makeChartData() },
      theme,
    );

    expect(options).toMatchObject({ animation: false });
  });

  it('passes onLineClicked to getLineChartProOptionsOnClick', () => {
    const onLineClicked = vi.fn();

    getLineChartGroupedProOptions(
      {
        dimension: makeDimension(),
        measure: makeMeasure(),
        data: makeChartData(),
        onLineClicked,
      },
      makeTheme(),
    );

    expect(getLineChartProOptionsOnClick).toHaveBeenCalledWith({ onLineClicked });
  });
});
