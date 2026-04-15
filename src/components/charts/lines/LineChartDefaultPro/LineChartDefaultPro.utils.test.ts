import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { getLineChartProData, getLineChartProOptions } from './LineChartDefaultPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { isColorValid, setColorAlpha } from '../../../../utils/color.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('../../../../utils/color.utils', () => ({ isColorValid: vi.fn(), setColorAlpha: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(),
  getStyleNumber: vi.fn((_, fallback: string) => Number.parseFloat(fallback)),
}));
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

describe('getLineChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
    vi.mocked(isColorValid).mockReturnValue(false);
    vi.mocked(setColorAlpha).mockImplementation((color) => `${color}-alpha`);
  });

  it('returns empty labels and single empty dataset when data is falsy', () => {
    const result = getLineChartProData(
      {
        data: null as never,
        dimension: makeDimension(),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([{ data: [] }]);
  });

  it('returns labels from the dimension column', () => {
    const dimension = makeDimension({ name: 'date' });
    const data = [
      { date: 'Jan', revenue: 10 },
      { date: 'Feb', revenue: 20 },
    ];

    const result = getLineChartProData(
      { data, dimension, measures: [makeMeasure({ name: 'revenue' })], hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan', 'Feb']);
  });

  it('creates one dataset per measure', () => {
    const data = [{ date: 'Jan', revenue: 10, cost: 5 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' }), makeMeasure({ name: 'cost', title: 'Cost' })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(2);
  });

  it('uses themeFormatter.dimensionOrMeasureTitle for dataset labels', () => {
    const measure = makeMeasure({ name: 'revenue', title: 'Revenue' });
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      { data, dimension: makeDimension(), measures: [measure], hasMinMaxYAxisRange: false },
      makeTheme(),
    );

    expect(result.datasets[0]?.label).toBe('Revenue');
    expect(mockFormatter.dimensionOrMeasureTitle).toHaveBeenCalledWith(measure);
  });

  it('maps measure values in row order', () => {
    const data = [
      { date: 'Jan', revenue: 10 },
      { date: 'Feb', revenue: 20 },
    ];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([10, 20]);
  });

  it('fills null for missing values when connectGaps is false', () => {
    const data = [
      { date: 'Jan', revenue: null },
      { date: 'Feb', revenue: 20 },
    ];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { connectGaps: false } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([null, 20]);
  });

  it('fills 0 for missing values when connectGaps is true', () => {
    const data = [
      { date: 'Jan', revenue: null },
      { date: 'Feb', revenue: 20 },
    ];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { connectGaps: true } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([0, 20]);
  });

  it('sets clip from hasMinMaxYAxisRange', () => {
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        hasMinMaxYAxisRange: true,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.clip).toBe(true);
  });

  it('sets fill from measure.inputs.fillUnderLine', () => {
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { fillUnderLine: true } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.fill).toBe(true);
  });

  it('sets borderDash when dashedLine is true', () => {
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { dashedLine: true } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.borderDash).toBeDefined();
  });

  it('leaves borderDash undefined when dashedLine is false', () => {
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { dashedLine: false } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.borderDash).toBeUndefined();
  });

  it('uses lineColor directly when it is a valid color', () => {
    vi.mocked(isColorValid).mockReturnValue(true);
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { lineColor: '#ff0000' } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.borderColor).toBe('#ff0000');
    expect(getDimensionMeasureColor).not.toHaveBeenCalled();
  });

  it('falls back to getDimensionMeasureColor when lineColor is not valid', () => {
    vi.mocked(isColorValid).mockReturnValue(false);
    const data = [{ date: 'Jan', revenue: 10 }];

    getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue', inputs: { lineColor: 'not-a-color' } })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(getDimensionMeasureColor).toHaveBeenCalled();
  });

  it('applies setColorAlpha to background color', () => {
    vi.mocked(isColorValid).mockReturnValue(false);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color }) =>
      color === 'background' ? '#bg' : '#bd',
    );
    const data = [{ date: 'Jan', revenue: 10 }];

    const result = getLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(setColorAlpha).toHaveBeenCalledWith('#bg', 0.5);
    expect(result.datasets[0]?.backgroundColor).toBe('#bg-alpha');
  });
});

// ---------------------------------------------------------------------------

describe('getLineChartProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
  });

  const makeChartData = () => ({
    labels: ['Jan', 'Feb'],
    datasets: [],
  });

  it('formats datalabel values via themeFormatter.data', () => {
    const measure = makeMeasure();
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [measure], data: makeChartData() },
      makeTheme(),
    );

    const formatter = options.plugins?.datalabels?.labels?.value?.formatter as (
      v: number,
      ctx: { datasetIndex: number },
    ) => string;
    expect(formatter(42, { datasetIndex: 0 })).toBe('fmt:42');
  });

  it('returns raw value for datalabels when disableFormatting.chart.labels is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { labels: true } } });
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    const formatter = options.plugins?.datalabels?.labels?.value?.formatter as (
      v: number,
      ctx: { datasetIndex: number },
    ) => number;
    expect(formatter(99, { datasetIndex: 0 })).toBe(99);
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats tooltip title via themeFormatter.data', () => {
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      makeTheme(),
    );

    const title = options.plugins?.tooltip?.callbacks?.title as (ctx: object[]) => string;
    expect(title([{ label: 'Jan' }])).toBe('fmt:Jan');
  });

  it('returns raw label for tooltip title when disableFormatting.chart.tooltip is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { tooltip: true } } });
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    const title = options.plugins?.tooltip?.callbacks?.title as (ctx: object[]) => string;
    expect(title([{ label: 'Mar' }])).toBe('Mar');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats tooltip label with dataset label and formatted value', () => {
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      makeTheme(),
    );

    const label = options.plugins?.tooltip?.callbacks?.label as (ctx: object) => string;
    expect(label({ raw: 100, dataset: { label: 'Revenue' }, datasetIndex: 0 })).toContain(
      'fmt:100',
    );
  });

  it('returns raw tooltip label when disableFormatting.chart.tooltip is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { tooltip: true } } });
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    const label = options.plugins?.tooltip?.callbacks?.label as (ctx: object) => string;
    expect(label({ raw: 100, dataset: { label: 'Revenue' }, datasetIndex: 0 })).toBe(
      'Revenue: 100',
    );
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('formats x-axis tick via themeFormatter.data', () => {
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    expect(callback(0)).toBe('fmt:Jan');
  });

  it('returns raw label for x-axis tick when disableFormatting.chart.xAxis is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { xAxis: true } } });
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    expect(callback(1)).toBe('Feb');
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('returns undefined for x-axis tick when data has no labels', () => {
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: { datasets: [] } },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.x?.ticks?.callback as any;
    expect(callback(0)).toBeUndefined();
  });

  it('formats y-axis tick via themeFormatter.data using measures[0]', () => {
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      makeTheme(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.y?.ticks?.callback as any;
    expect(callback(500)).toBe('fmt:500');
  });

  it('returns raw value for y-axis tick when disableFormatting.chart.yAxis is true', () => {
    const theme = makeTheme({ disableFormatting: { chart: { yAxis: true } } });
    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = options.scales?.y?.ticks?.callback as any;
    expect(callback(42)).toBe(42);
    expect(mockFormatter.data).not.toHaveBeenCalled();
  });

  it('merges theme.charts.lineChartDefaultPro.options when present', () => {
    const theme = makeTheme({
      charts: { lineChartDefaultPro: { options: { animation: false } } },
    });

    const options = getLineChartProOptions(
      { dimension: makeDimension(), measures: [makeMeasure()], data: makeChartData() },
      theme,
    );

    expect(options).toMatchObject({ animation: false });
  });
});
