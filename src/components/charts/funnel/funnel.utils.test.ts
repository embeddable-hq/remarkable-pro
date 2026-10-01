import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { Context } from 'chartjs-plugin-datalabels';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import {
  getDefaultFunnelPalette,
  getFunnelChartProData,
  getFunnelChartProOptions,
  getFunnelOptionsDatalabelsFormatter,
} from './funnel.utils';

vi.mock('../../../utils/color.utils', () => ({
  getColorGradient: vi.fn((start: string, end: string, steps: number) =>
    Array.from({ length: steps }, (_, i) => `${start}->${end}@${i}`),
  ),
  brightenColor: vi.fn((value: string, amount: number) => `${value}+${amount}`),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => ['#336699', '#112233', '#445566', '#778899', '#99aabb']),
}));

vi.mock('../../../theme/formatter/formatter.utils', () => ({
  // By default: returns the value unchanged, so value === formattedValue (i18n fallback path)
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_dim: unknown, value: unknown) => value),
    dimensionOrMeasureTitle: vi.fn((measure: { name: string }) => measure.name),
  })),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

vi.mock('../charts.utils', () => ({
  getDimensionWithoutTruncation: vi.fn((dimension: unknown) => dimension),
}));

const makeDimension = (name = 'section'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'count'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

describe('getFunnelChartProData', () => {
  const sectionDimension = makeDimension('section');
  const countMeasure = makeMeasure('count');

  it('returns empty data when there are no rows', () => {
    const result = getFunnelChartProData({
      data: [],
      sectionDimension,
      countMeasure,
    });

    expect(result).toEqual({ labels: [], datasets: [{ data: [] }] });
  });

  it('sums counts per section and orders by descending total when no order dimension is given', () => {
    const data: DataResponse['data'] = [
      { section: 'Recordable', count: '10' },
      { section: 'Near Misses', count: '20' },
      { section: 'Near Misses', count: '13' },
    ];

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)']);
    expect(result.datasets[0]?.data).toEqual([33, 10]);
  });

  it('orders sections ascending by the order dimension when provided', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { section: 'DART', count: '5', order: '4' },
      { section: 'Near Misses', count: '33', order: '1' },
      { section: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(DART)']);
    expect(result.datasets[0]?.data).toEqual([33, 14, 5]);
  });

  it('builds the background gradient from the theme-derived default palette', () => {
    const data: DataResponse['data'] = [
      { section: 'A', count: '1' },
      { section: 'B', count: '2' },
    ];

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure });

    const { start, end } = getDefaultFunnelPalette();
    expect(result.datasets[0]?.backgroundColor).toEqual([
      `${start}->${end}@0`,
      `${start}->${end}@1`,
    ]);
  });

  it('prefers startColor/endColor over the theme default when both are set', () => {
    const data: DataResponse['data'] = [{ section: 'A', count: '1' }];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      startColor: '#111111',
      endColor: '#222222',
    });

    expect(result.datasets[0]?.backgroundColor).toEqual(['#111111->#222222@0']);
  });

  it('derives startColor from endColor when only endColor is set', () => {
    const data: DataResponse['data'] = [{ section: 'A', count: '1' }];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      endColor: '#222222',
    });

    expect(result.datasets[0]?.backgroundColor).toEqual(['#222222+2.2->#222222@0']);
  });

  it('derives endColor from startColor when only startColor is set', () => {
    const data: DataResponse['data'] = [{ section: 'A', count: '1' }];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      startColor: '#111111',
    });

    expect(result.datasets[0]?.backgroundColor).toEqual(['#111111->#111111+-2.2@0']);
  });

  it('treats missing data as an empty result', () => {
    const result = getFunnelChartProData({
      data: undefined as unknown as DataResponse['data'],
      sectionDimension,
      countMeasure,
    });

    expect(result).toEqual({ labels: [], datasets: [{ data: [] }] });
  });

  it('ignores rows with a missing or empty section value', () => {
    const data: DataResponse['data'] = [
      { section: '', count: '10' },
      { count: '5' },
      { section: 'Recordable', count: '14' },
    ];

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure });

    expect(result.labels).toEqual(['t(Recordable)']);
    expect(result.datasets[0]?.data).toEqual([14]);
  });

  it('defaults a missing count value to 0', () => {
    const data: DataResponse['data'] = [{ section: 'Recordable' }];

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure });

    expect(result.datasets[0]?.data).toEqual([0]);
  });

  it('sorts sections missing an order value last', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { section: 'Unordered', count: '1' },
      { section: 'Near Misses', count: '33', order: '1' },
      { section: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(Unordered)']);
  });

  it('sorts sections with a nonnumeric order value last', () => {
    const orderDimension = makeDimension('order');
    const data: DataResponse['data'] = [
      { section: 'Nonnumeric', count: '1', order: 'not-a-number' },
      { section: 'Near Misses', count: '33', order: '1' },
      { section: 'Recordable', count: '14', order: '3' },
    ];

    const result = getFunnelChartProData({
      data,
      sectionDimension,
      countMeasure,
      orderDimension,
    });

    expect(result.labels).toEqual(['t(Near Misses)', 't(Recordable)', 't(Nonnumeric)']);
  });

  it('overrides a single section color via theme.charts.backgroundColorMap', () => {
    const data: DataResponse['data'] = [
      { section: 'A', count: '1' },
      { section: 'B', count: '2' },
    ];
    const theme = {
      charts: { backgroundColorMap: { dimensionValue: { 'section.B': '#ff0000' } } },
    } as never;

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure }, theme);

    // Sections sort descending by count (no orderDimension), so 'B' (count 2) is index 0.
    expect(result.labels).toEqual(['t(B)', 't(A)']);
    const { start, end } = getDefaultFunnelPalette();
    expect(result.datasets[0]?.backgroundColor).toEqual(['#ff0000', `${start}->${end}@1`]);
  });

  it('falls back to theme.charts.borderColorMap when backgroundColorMap has no entry for the section', () => {
    const data: DataResponse['data'] = [{ section: 'A', count: '1' }];
    const theme = {
      charts: { borderColorMap: { dimensionValue: { 'section.A': '#00ff00' } } },
    } as never;

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure }, theme);

    expect(result.datasets[0]?.backgroundColor).toEqual(['#00ff00']);
  });

  it('overrides every section color when the section dimension has a fixed input color', () => {
    const data: DataResponse['data'] = [
      { section: 'A', count: '1' },
      { section: 'B', count: '2' },
    ];
    const coloredSectionDimension = {
      ...sectionDimension,
      inputs: { color: '#123456' },
    } as unknown as Dimension;

    const result = getFunnelChartProData({
      data,
      sectionDimension: coloredSectionDimension,
      countMeasure,
    });

    expect(result.datasets[0]?.backgroundColor).toEqual(['#123456', '#123456']);
  });

  it('uses the formatted value as the label when it differs from the raw section name', () => {
    vi.mocked(getThemeFormatter).mockReturnValueOnce({
      data: vi.fn(() => 'Formatted Label'),
    } as unknown as ReturnType<typeof getThemeFormatter>);

    const data: DataResponse['data'] = [{ section: 'Recordable', count: '14' }];

    const result = getFunnelChartProData({ data, sectionDimension, countMeasure });

    expect(result.labels).toEqual(['Formatted Label']);
  });
});

describe('getDefaultFunnelPalette', () => {
  it('uses the first theme chart color as the end color and a brightened variant as the start color', () => {
    const { start, end } = getDefaultFunnelPalette();

    expect(end).toBe('#336699');
    expect(start).toBe('#336699+2.2');
  });

  it('falls back to the last theme chart color when the first one does not resolve', () => {
    vi.mocked(getChartColors).mockReturnValueOnce(['', '#112233', '#445566', '#778899', '#99aabb']);

    const { end } = getDefaultFunnelPalette();

    expect(end).toBe('#99aabb');
  });

  it('falls back to the design system default when no theme chart color resolves', () => {
    vi.mocked(getChartColors).mockReturnValueOnce(['', '']);

    const { end } = getDefaultFunnelPalette();

    expect(end).toBe('#ff5400');
  });
});

describe('getFunnelChartProOptions', () => {
  const countMeasure = makeMeasure('count');

  it('uses legendPosition from theme', () => {
    const options = getFunnelChartProOptions({ countMeasure }, {
      charts: { legendPosition: 'right' },
    } as never);
    expect(options.plugins?.legend?.position).toBe('right');
  });

  it('defaults legendPosition to "bottom" when theme does not specify one', () => {
    const options = getFunnelChartProOptions({ countMeasure }, { charts: {} } as never);
    expect(options.plugins?.legend?.position).toBe('bottom');
  });

  it('formats the tooltip label with the measure title and formatted value', () => {
    const options = getFunnelChartProOptions({ countMeasure }, { charts: {} } as never);

    const labelCallback = options.plugins?.tooltip?.callbacks?.label as (
      context: unknown,
    ) => string;
    const label = labelCallback({ raw: 42 });

    expect(label).toBe('count: 42');
  });

  it('omits datalabels when showSectionLabels is not enabled', () => {
    const options = getFunnelChartProOptions({ countMeasure }, { charts: {} } as never);
    expect(options.plugins?.datalabels).toBeUndefined();
  });

  it('wires the datalabels formatter from the config when showSectionLabels is enabled', () => {
    const options = getFunnelChartProOptions({ countMeasure, showSectionLabels: true }, {
      charts: {},
    } as never);
    const context = {
      chart: { data: { labels: ['Recordable'], datasets: [{ data: [10] }] } },
      dataIndex: 0,
      datasetIndex: 0,
    } as unknown as Context;

    const text = options.plugins?.datalabels?.formatter?.(10, context);

    expect(text).toBe('Recordable');
  });
});

describe('getFunnelOptionsDatalabelsFormatter', () => {
  it('returns only the section label when showValueLabels is disabled', () => {
    const formatter = getFunnelOptionsDatalabelsFormatter({ showSectionLabels: true });
    const context = {
      chart: { data: { labels: ['Recordable'], datasets: [{ data: [10] }] } },
      dataIndex: 0,
      datasetIndex: 0,
    } as unknown as Context;

    expect(formatter(10, context)).toBe('Recordable');
  });

  it('appends the raw value when showValueLabels is enabled', () => {
    const formatter = getFunnelOptionsDatalabelsFormatter({
      showSectionLabels: true,
      showValueLabels: true,
    });
    const context = {
      chart: { data: { labels: ['Recordable'], datasets: [{ data: [10, 30] }] } },
      dataIndex: 0,
      datasetIndex: 0,
    } as unknown as Context;

    expect(formatter(10, context)).toBe('Recordable: 10');
  });

  it('appends the percentage of total when displayPercentages is also enabled', () => {
    const formatter = getFunnelOptionsDatalabelsFormatter({
      showSectionLabels: true,
      showValueLabels: true,
      displayPercentages: true,
    });
    const context = {
      chart: { data: { labels: ['Recordable'], datasets: [{ data: [10, 30] }] } },
      dataIndex: 0,
      datasetIndex: 0,
    } as unknown as Context;

    expect(formatter(10, context)).toBe('Recordable: 25.0%');
  });

  it('reports a 0% value when the dataset total is 0', () => {
    const formatter = getFunnelOptionsDatalabelsFormatter({
      showSectionLabels: true,
      showValueLabels: true,
      displayPercentages: true,
    });
    const context = {
      chart: { data: { labels: ['Recordable'], datasets: [{ data: [0] }] } },
      dataIndex: 0,
      datasetIndex: 0,
    } as unknown as Context;

    expect(formatter(0, context)).toBe('Recordable: 0.0%');
  });
});
