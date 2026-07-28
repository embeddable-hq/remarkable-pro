import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { Chart } from 'chart.js';
import { createAreaClickHandler } from './AreaChartPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';

vi.mock('../LineChartGroupedPro/LineChartGroupedPro.utils', () => ({
  getLineChartGroupedProData: vi.fn(),
  getLineChartGroupedProOptions: vi.fn(),
}));

vi.mock('../../../../utils/color.utils', () => ({
  isColorValid: vi.fn(() => true),
  setColorAlpha: vi.fn((color: string) => color),
}));

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(),
}));

const makeDimension = (name = 'date'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'value'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

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
  groupBy: makeDimension('category'),
};

const range = {
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31'),
  relativeTimeString: undefined,
};

describe('createAreaClickHandler user interaction values', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nulls out the point dimension value when the x dimension resolves to a time range', () => {
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(range);
    const instance = makeChartInstance({ 0: [{ x: 100, y: 50 }] });
    vi.spyOn(Chart, 'getChart').mockReturnValue(instance as never);

    const onPointClicked = vi.fn();
    const handler = createAreaClickHandler({ ...defaultHandlerProps, onPointClicked });
    handler(makeArgs(100, 50, [{ index: 0, datasetIndex: 0 }]) as never);

    expect(onPointClicked).toHaveBeenCalledWith(
      expect.objectContaining({ dimensionValue: undefined, dimensionTimeRange: range }),
    );
  });

  it('nulls out the grouping dimension value when the grouping resolves to a time range', () => {
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(range);
    const instance = makeChartInstance({
      0: [{ x: 100, y: 300 }],
      1: [{ x: 100, y: 200 }],
    });
    vi.spyOn(Chart, 'getChart').mockReturnValue(instance as never);

    const onAreaClicked = vi.fn();
    const handler = createAreaClickHandler({ ...defaultHandlerProps, onAreaClicked });
    handler(makeArgs(100, 250) as never);

    expect(onAreaClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        groupingDimensionValue: undefined,
        groupingDimensionTimeRange: range,
      }),
    );
  });
});
