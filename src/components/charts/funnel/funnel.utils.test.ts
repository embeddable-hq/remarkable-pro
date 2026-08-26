import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { FUNNEL_PALETTES, getFunnelChartProData } from './funnel.utils';

vi.mock('../../../utils/color.utils', () => ({
  getColorGradient: vi.fn((start: string, end: string, steps: number) =>
    Array.from({ length: steps }, (_, i) => `${start}->${end}@${i}`),
  ),
}));

vi.mock('../../../theme/formatter/formatter.utils', () => ({
  // By default: returns the value unchanged, so value === formattedValue (i18n fallback path)
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_dim: unknown, value: unknown) => value),
  })),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

vi.mock('../charts.utils', () => ({
  getDimensionWithoutTruncation: vi.fn((dimension: unknown) => dimension),
}));

const makeDimension = (name = 'stage'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'count'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

describe('getFunnelChartProData', () => {
  const stageDimension = makeDimension('stage');
  const countMeasure = makeMeasure('count');

  it('returns empty data when there are no rows', () => {
    const result = getFunnelChartProData({
      data: [],
      stageDimension,
      countMeasure,
    });

    expect(result).toEqual({ labels: [], datasets: [{ data: [] }] });
  });

  it('sums counts per stage and orders by descending total when no order dimension is given', () => {
    const data: DataResponse['data'] = [
      { stage: 'Recordable', count: '10' },
      { stage: 'Near Misses', count: '20' },
      { stage: 'Near Misses', count: '13' },
    ];

    const result = getFunnelChartProData({ data, stageDimension, countMeasure });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)']);
    expect(result.datasets[0]?.data).toEqual([33, 10]);
  });

  it('orders stages ascending by the order dimension when provided', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { stage: 'DART', count: '5', order: '4' },
      { stage: 'Near Misses', count: '33', order: '1' },
      { stage: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(DART)']);
    expect(result.datasets[0]?.data).toEqual([33, 14, 5]);
  });

  it('builds the background gradient from the resolved palette', () => {
    const data: DataResponse['data'] = [
      { stage: 'A', count: '1' },
      { stage: 'B', count: '2' },
    ];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      colorScheme: 'blue',
    });

    const { start, end } = FUNNEL_PALETTES.blue!;
    expect(result.datasets[0]?.backgroundColor).toEqual([
      `${start}->${end}@0`,
      `${start}->${end}@1`,
    ]);
  });

  it('prefers startColor/endColor over colorScheme when both are set', () => {
    const data: DataResponse['data'] = [{ stage: 'A', count: '1' }];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      colorScheme: 'blue',
      startColor: '#111111',
      endColor: '#222222',
    });

    expect(result.datasets[0]?.backgroundColor).toEqual(['#111111->#222222@0']);
  });

  it('falls back to the amber palette when colorScheme is not recognized', () => {
    const data: DataResponse['data'] = [{ stage: 'A', count: '1' }];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      colorScheme: 'not-a-real-scheme',
    });

    const { start, end } = FUNNEL_PALETTES.amber!;
    expect(result.datasets[0]?.backgroundColor).toEqual([`${start}->${end}@0`]);
  });

  it('treats missing data as an empty result', () => {
    const result = getFunnelChartProData({
      data: undefined as unknown as DataResponse['data'],
      stageDimension,
      countMeasure,
    });

    expect(result).toEqual({ labels: [], datasets: [{ data: [] }] });
  });

  it('ignores rows with a missing or empty stage value', () => {
    const data: DataResponse['data'] = [
      { stage: '', count: '10' },
      { count: '5' },
      { stage: 'Recordable', count: '14' },
    ];

    const result = getFunnelChartProData({ data, stageDimension, countMeasure });

    expect(result.labels).toEqual(['t(Recordable)']);
    expect(result.datasets[0]?.data).toEqual([14]);
  });

  it('defaults a missing count value to 0', () => {
    const data: DataResponse['data'] = [{ stage: 'Recordable' }];

    const result = getFunnelChartProData({ data, stageDimension, countMeasure });

    expect(result.datasets[0]?.data).toEqual([0]);
  });

  it('sorts stages missing an order value last', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { stage: 'Unordered', count: '1' },
      { stage: 'Near Misses', count: '33', order: '1' },
      { stage: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(Unordered)']);
  });

  it('sorts stages with a nonnumeric order value last', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { stage: 'Nonnumeric', count: '1', order: 'not-a-number' },
      { stage: 'Near Misses', count: '33', order: '1' },
      { stage: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      stageDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(Nonnumeric)']);
  });

  it('uses the formatted value as the label when it differs from the raw stage name', () => {
    vi.mocked(getThemeFormatter).mockReturnValueOnce({
      data: vi.fn(() => 'Formatted Label'),
    } as unknown as ReturnType<typeof getThemeFormatter>);

    const data: DataResponse['data'] = [{ stage: 'Recordable', count: '14' }];

    const result = getFunnelChartProData({ data, stageDimension, countMeasure });

    expect(result.labels).toEqual(['Formatted Label']);
  });
});
