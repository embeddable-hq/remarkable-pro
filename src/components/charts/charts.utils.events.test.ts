import type { ChartData } from 'chart.js';
import type { Dimension, Measure } from '@embeddable.com/core';
import { createSimpleClickHandler } from './charts.utils';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';

vi.mock('../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

vi.mock('../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(),
}));

const makeDimension = (name = 'category'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'value'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeClick = (index: number, datasetIndex = 0) =>
  ({ elementAtEvent: [{ index, datasetIndex }] }) as never;

describe('createSimpleClickHandler user interaction values', () => {
  const mockGetTimeRange = vi.mocked(getTimeRangeFromDimensionValue);

  beforeEach(() => {
    mockGetTimeRange.mockReset();
  });

  it('builds measureValues from the datasets at the clicked index when measures are provided', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const data = {
      labels: ['Apple', 'Banana'],
      datasets: [{ data: [10, 20] }, { data: [30, 40] }],
    } as unknown as ChartData;

    const handler = createSimpleClickHandler({
      data,
      dimension: makeDimension('category'),
      measures: [makeMeasure('sales'), makeMeasure('profit')],
      onClicked,
    });

    handler(makeClick(1));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({ measureValues: { sales: 20, profit: 40 } }),
    );
  });

  it('sets dimensionValue to undefined when a dimensionTimeRange is derived', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue({
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
      relativeTimeString: undefined,
    });

    const data = {
      labels: ['2024-01-01'],
      datasets: [{ data: [1] }],
    } as unknown as ChartData;

    const handler = createSimpleClickHandler({
      data,
      dimension: {
        name: 'date',
        __type__: 'dimension',
        nativeType: 'time',
        inputs: {},
      } as unknown as Dimension,
      onClicked,
    });

    handler(makeClick(0));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: undefined }));
  });
});
