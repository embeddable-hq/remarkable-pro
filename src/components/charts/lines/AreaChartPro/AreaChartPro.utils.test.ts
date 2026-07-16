import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { Chart } from 'chart.js';
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

  const makeChartInstance = (
    datasetPoints: Record<number, { x: number; y: number }[]> = {},
    chartAreaBottom: number | undefined = 500,
  ) => {
    const keys = Object.keys(datasetPoints).map(Number);
    const numDatasets = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    return {
      getDatasetMeta: vi.fn((datasetIndex: number) => ({
        data: datasetPoints[datasetIndex] ?? [],
      })),
      chartArea: chartAreaBottom != null ? { bottom: chartAreaBottom } : undefined,
      data: { datasets: Array.from({ length: numDatasets }) },
    };
  };

  const makeArgs = (
    offsetX: number,
    offsetY: number,
    elementAtEvent: { index: number; datasetIndex: number }[] = [],
  ) => ({
    event: { target: {}, nativeEvent: { offsetX, offsetY } },
    elementAtEvent,
    elementsAtEvent: [],
    datasetAtEvent: [],
  });

  const defaultHandlerProps = {
    data: chartData as never,
    dimension: makeDimension(),
    measure: makeMeasure(),
    groupBy: makeDimension({ name: 'category' }),
  };

  let mockChartInstance: ReturnType<typeof makeChartInstance>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(undefined);
    mockChartInstance = makeChartInstance({ 0: [{ x: 100, y: 300 }] });
    vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
  });

  describe('onAreaClicked', () => {
    it('does not throw when onAreaClicked is not provided', () => {
      const handler = createAreaClickHandler(defaultHandlerProps);
      expect(() => handler(makeArgs(100, 350) as never)).not.toThrow();
    });

    it('does not call onAreaClicked when Chart.getChart returns null', () => {
      const onAreaClicked = vi.fn();
      vi.spyOn(Chart, 'getChart').mockReturnValue(undefined as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 350) as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('selects the dataset whose interpolated area contains the click', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 250) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('interpolates the line y-value between two data points', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [
          { x: 0, y: 400 },
          { x: 200, y: 200 },
        ],
        1: [
          { x: 0, y: 300 },
          { x: 200, y: 100 },
        ],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 250) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('selects the lower segment when clicking just below the shared boundary', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 305) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('selects the upper segment when clicking just above the shared boundary', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 295) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('does not call onAreaClicked when click is outside all filled areas', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 50) as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('passes groupingDimensionValue from dataset rawLabel', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 350) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('calls getTimeRangeFromDimensionValue for the grouping dimension', () => {
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 350) as never);
      expect(getTimeRangeFromDimensionValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('onPointClicked', () => {
    it('calls onPointClicked instead of onAreaClicked when a point is hit', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({ 0: [{ x: 100, y: 50 }] });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({
        ...defaultHandlerProps,
        onPointClicked,
        onAreaClicked,
      });
      handler(makeArgs(100, 50, [{ index: 0, datasetIndex: 0 }]) as never);
      expect(onPointClicked).toHaveBeenCalled();
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('falls through to onAreaClicked when click is far from the detected point', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [{ x: 100, y: 300 }],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({
        ...defaultHandlerProps,
        onPointClicked,
        onAreaClicked,
      });
      handler(makeArgs(100, 200, [{ index: 0, datasetIndex: 0 }]) as never);
      expect(onPointClicked).not.toHaveBeenCalled();
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('passes dimensionValue from labels at the clicked element index', () => {
      const onPointClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [
          { x: 100, y: 0 },
          { x: 100, y: 50 },
        ],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(makeArgs(100, 50, [{ index: 1, datasetIndex: 0 }]) as never);
      expect(onPointClicked).toHaveBeenCalledWith(
        expect.objectContaining({ dimensionValue: 'Feb' }),
      );
    });

    it('passes measureValue from the dataset at the clicked element index', () => {
      const onPointClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        1: [
          { x: 100, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 50 },
        ],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(makeArgs(100, 50, [{ index: 2, datasetIndex: 1 }]) as never);
      expect(onPointClicked).toHaveBeenCalledWith(expect.objectContaining({ measureValue: 90 }));
    });

    it('calls getTimeRangeFromDimensionValue for the x dimension', () => {
      const onPointClicked = vi.fn();
      mockChartInstance = makeChartInstance({ 0: [{ x: 100, y: 50 }] });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(makeArgs(100, 50, [{ index: 0, datasetIndex: 0 }]) as never);
      expect(getTimeRangeFromDimensionValue).toHaveBeenCalledWith(
        expect.objectContaining({ dimension: defaultHandlerProps.dimension }),
      );
    });

    it('falls through to onAreaClicked when no point element is under the cursor', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      const handler = createAreaClickHandler({
        ...defaultHandlerProps,
        onPointClicked,
        onAreaClicked,
      });
      handler(makeArgs(100, 350) as never);
      expect(onPointClicked).not.toHaveBeenCalled();
      expect(onAreaClicked).toHaveBeenCalled();
    });

    it('does not call onPointClicked when pointY pixel is not available', () => {
      const onPointClicked = vi.fn();
      mockChartInstance = makeChartInstance({});
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
      handler(makeArgs(100, 50, [{ index: 5, datasetIndex: 0 }]) as never);
      expect(onPointClicked).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('uses Infinity as chartBottom when chart.chartArea is undefined', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({ 0: [{ x: 100, y: 300 }] }, undefined);
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 400) as never);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('skips a dataset when interpolated lineY is null (clickX outside all segments)', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [
          { x: 0, y: 400 },
          { x: 50, y: 300 },
        ],
        1: [
          { x: 0, y: 200 },
          { x: 50, y: 150 },
        ],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(200, 250) as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('skips a dataset when its previous line interpolation returns null', () => {
      const onAreaClicked = vi.fn();
      mockChartInstance = makeChartInstance({
        0: [],
        1: [{ x: 100, y: 200 }],
      });
      vi.spyOn(Chart, 'getChart').mockReturnValue(mockChartInstance as never);
      const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
      handler(makeArgs(100, 300) as never);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });
  });
});
