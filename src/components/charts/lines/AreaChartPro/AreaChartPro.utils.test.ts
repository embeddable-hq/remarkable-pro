import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  createAreaClickHandler,
  getAreaChartProData,
  getAreaChartProOptions,
} from './AreaChartPro.utils';

vi.mock('../LineChartGroupedPro/LineChartGroupedPro.utils', () => ({
  getLineChartGroupedProData: vi.fn(),
  getLineChartGroupedProOptions: vi.fn(),
}));

vi.mock('../../../../utils/color.utils', () => ({
  setColorAlpha: vi.fn((color: string, alpha: number) => `${color}@${alpha}`),
}));

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(() => undefined),
}));

import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from '../LineChartGroupedPro/LineChartGroupedPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';

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

const makeChartData = (labels: string[], datasets: { data: number[] }[] = []) => ({
  labels,
  datasets,
});

// ----------------------------------------------------------------------------

describe('getAreaChartProData', () => {
  it('sets backgroundColor to 0.9 opacity on every dataset', () => {
    vi.mocked(getLineChartGroupedProData).mockReturnValue({
      labels: ['Jan'],
      datasets: [
        { data: [100], backgroundColor: 'rgba(255,0,0,0.5)' },
        { data: [50], backgroundColor: 'rgba(0,255,0,0.5)' },
      ],
    } as never);

    const result = getAreaChartProData(
      {
        data: [],
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets.every((ds) => (ds.backgroundColor as string).endsWith('@0.9'))).toBe(
      true,
    );
  });

  it('sets fill: true on every dataset', () => {
    vi.mocked(getLineChartGroupedProData).mockReturnValue({
      labels: ['Jan', 'Feb'],
      datasets: [
        { data: [100, 200], label: 'Group A', fill: false },
        { data: [50, 75], label: 'Group B', fill: false },
      ],
    } as never);

    const result = getAreaChartProData(
      {
        data: [
          { date: 'Jan', revenue: 100 },
          { date: 'Feb', revenue: 200 },
        ],
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets.every((ds) => ds.fill === true)).toBe(true);
  });

  it('preserves all other dataset properties when setting fill', () => {
    vi.mocked(getLineChartGroupedProData).mockReturnValue({
      labels: ['Jan'],
      datasets: [{ data: [100], label: 'Group A', borderColor: '#ff0000' }],
    } as never);

    const result = getAreaChartProData(
      {
        data: [{ date: 'Jan', revenue: 100 }],
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]).toMatchObject({
      data: [100],
      label: 'Group A',
      borderColor: '#ff0000',
      fill: true,
    });
  });

  it('preserves labels from the underlying grouped line chart data', () => {
    vi.mocked(getLineChartGroupedProData).mockReturnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ data: [1, 2, 3] }],
    } as never);

    const result = getAreaChartProData(
      {
        data: [],
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('delegates to getLineChartGroupedProData with the same props and theme', () => {
    vi.mocked(getLineChartGroupedProData).mockReturnValue({ labels: [], datasets: [] } as never);

    const props = {
      data: [{ date: 'Jan', revenue: 42 }],
      dimension: makeDimension(),
      groupDimension: makeDimension({ name: 'category' }),
      measure: makeMeasure(),
      hasMinMaxYAxisRange: true,
    };
    const theme = makeTheme();

    getAreaChartProData(props, theme);

    expect(getLineChartGroupedProData).toHaveBeenCalledWith(props, theme);
  });
});

// ----------------------------------------------------------------------------

describe('getAreaChartProOptions', () => {
  beforeEach(() => {
    vi.mocked(getLineChartGroupedProOptions).mockReturnValue({ scales: { x: {}, y: {} } } as never);
  });

  it('sets scales.y.stacked to true', () => {
    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        data: makeChartData([]) as never,
      },
      makeTheme(),
    );

    expect(result.scales?.y?.stacked).toBe(true);
  });

  it('delegates to getLineChartGroupedProOptions with the same options and theme', () => {
    const options = {
      dimension: makeDimension(),
      groupDimension: makeDimension({ name: 'category' }),
      measure: makeMeasure(),
      data: makeChartData([]) as never,
    };
    const theme = makeTheme();

    getAreaChartProOptions(options, theme);

    expect(getLineChartGroupedProOptions).toHaveBeenCalledWith(options, theme);
  });

  it('merges areaChartPro theme options when provided', () => {
    const theme = {
      charts: {
        areaChartPro: { options: { animation: false } },
      },
    } as never;

    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        data: makeChartData([]) as never,
      },
      theme,
    );

    expect((result as { animation?: unknown }).animation).toBe(false);
  });

  it('works without areaChartPro theme options defined', () => {
    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        groupDimension: makeDimension({ name: 'category' }),
        measure: makeMeasure(),
        data: makeChartData([]) as never,
      },
      makeTheme(),
    );

    expect(result.scales).toBeDefined();
  });
});

// ----------------------------------------------------------------------------

describe('createAreaClickHandler', () => {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { rawLabel: 'Group A', data: [100, 200, 300] },
      { rawLabel: 'Group B', data: [50, 75, 90] },
    ],
  };

  // x defaults to 100 so most tests don't need to specify it
  const makeEvent = (y: number | null, x: number | null = 100) => ({
    x,
    y,
    native: {},
  });

  // datasetPoints: datasetIndex → pixel-space points [{x, y}]
  // numDatasets in chart.data.datasets is derived from max key + 1
  const makeChart = (
    pointElements: { index: number; datasetIndex: number }[] = [],
    datasetPoints: Record<number, { x: number; y: number }[]> = {},
    chartAreaBottom = 500,
  ) => {
    const keys = Object.keys(datasetPoints).map(Number);
    const numDatasets = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    return {
      getElementsAtEventForMode: vi.fn(() => pointElements),
      getDatasetMeta: vi.fn((datasetIndex: number) => ({
        data: datasetPoints[datasetIndex] ?? [],
      })),
      chartArea: { bottom: chartAreaBottom },
      data: { datasets: Array.from({ length: numDatasets }) },
    };
  };

  const defaultHandlerProps = {
    data: chartData as never,
    dimension: makeDimension(),
    groupBy: makeDimension({ name: 'category' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(undefined);
  });

  describe('onAreaClicked', () => {
    it('does not throw when onAreaClicked is not provided', () => {
      const handler = createAreaClickHandler(defaultHandlerProps);
      const chart = makeChart([], { 0: [{ x: 100, y: 300 }] });
      expect(() => handler(makeEvent(350) as never, [] as never, chart as never)).not.toThrow();
    });

    it('does not call onAreaClicked when clickX is null', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], { 0: [{ x: 100, y: 300 }] });
      handler({ x: null, y: 350, native: {} } as never, [] as never, chart as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('does not call onAreaClicked when clickY is null', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], { 0: [{ x: 100, y: 300 }] });
      handler({ x: 100, y: null, native: {} } as never, [] as never, chart as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('selects the dataset whose interpolated area contains the click', () => {
      // ds=0 (Group A, bottom): line y=300, fills [300, chartBottom=500]
      // ds=1 (Group B, top):    line y=200, fills [200, 300]
      // click y=250 → Group B
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], {
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      handler(makeEvent(250) as never, [] as never, chart as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('interpolates the line y-value between two data points', () => {
      // ds=0: x=[0,200] y=[400,200] → at x=100: y=300
      // ds=1: x=[0,200] y=[300,100] → at x=100: y=200
      // Group B fills [200, 300], click y=250 → Group B
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], {
        0: [
          { x: 0, y: 400 },
          { x: 200, y: 200 },
        ],
        1: [
          { x: 0, y: 300 },
          { x: 200, y: 100 },
        ],
      });
      handler(makeEvent(250, 100) as never, [] as never, chart as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('selects the lower segment when clicking just below the shared boundary', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], {
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      // y=305 → inside Group A [300, 500], outside Group B [200, 300]
      handler(makeEvent(305) as never, [] as never, chart as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('selects the upper segment when clicking just above the shared boundary', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], {
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      // y=295 → inside Group B [200, 300]
      handler(makeEvent(295) as never, [] as never, chart as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('does not call onAreaClicked when click is outside all filled areas', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], {
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      // y=50 → above all areas (topmost starts at y=200)
      handler(makeEvent(50) as never, [] as never, chart as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('passes groupingDimensionValue from dataset rawLabel', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      // ds=0 only: fills [300, 500], click y=350 → Group A
      const chart = makeChart([], { 0: [{ x: 100, y: 300 }] });
      handler(makeEvent(350) as never, [] as never, chart as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('calls getTimeRangeFromDimensionValue for the grouping dimension', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      const chart = makeChart([], { 0: [{ x: 100, y: 300 }] });
      handler(makeEvent(350) as never, [] as never, chart as never);
      expect(getTimeRangeFromDimensionValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('onPointClicked', () => {
    it('calls onPointClicked instead of onAreaClicked when a point is hit', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({
        ...defaultHandlerProps,
        onPointClicked,
        onAreaClicked,
      });
      handler(
        makeEvent(50) as never,
        [] as never,
        makeChart([{ index: 0, datasetIndex: 0 }], { 0: [{ x: 100, y: 50 }] }) as never,
      );
      expect(onPointClicked).toHaveBeenCalled();
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('falls through to onAreaClicked when click is far from the detected point', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({
        ...defaultHandlerProps,
        onPointClicked,
        onAreaClicked,
      });
      // click y=200, point at y=300 — 100px apart, well beyond 8px threshold
      // Group B fills [200, 300], so area click should fire for Group B
      const chart = makeChart([{ index: 0, datasetIndex: 0 }], {
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      handler(makeEvent(200) as never, [] as never, chart as never);
      expect(onPointClicked).not.toHaveBeenCalled();
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('passes dimensionValue from labels at the clicked element index', () => {
      const onPointClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(
        makeEvent(50) as never,
        [] as never,
        makeChart([{ index: 1, datasetIndex: 0 }], {
          0: [
            { x: 100, y: 0 },
            { x: 100, y: 50 },
          ],
        }) as never,
      );
      expect(onPointClicked).toHaveBeenCalledWith(
        expect.objectContaining({ dimensionValue: 'Feb' }),
      );
    });

    it('passes measureValue from the dataset at the clicked element index', () => {
      const onPointClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(
        makeEvent(50) as never,
        [] as never,
        makeChart([{ index: 2, datasetIndex: 1 }], {
          1: [
            { x: 100, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
          ],
        }) as never,
      );
      expect(onPointClicked).toHaveBeenCalledWith(expect.objectContaining({ measureValue: 90 }));
    });

    it('calls getTimeRangeFromDimensionValue for the x dimension', () => {
      const onPointClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(
        makeEvent(50) as never,
        [] as never,
        makeChart([{ index: 0, datasetIndex: 0 }], { 0: [{ x: 100, y: 50 }] }) as never,
      );
      expect(getTimeRangeFromDimensionValue).toHaveBeenCalledTimes(1);
    });
  });
});
