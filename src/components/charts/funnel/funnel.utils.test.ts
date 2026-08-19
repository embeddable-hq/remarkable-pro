import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
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
});
