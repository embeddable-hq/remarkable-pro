import type { Dimension, Measure } from '@embeddable.com/core';
import { getPieChartProData, getPieChartProOptions } from './pies.utils';
import { getDimensionMeasureColor } from '../../../theme/styles/styles.utils';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { groupTailAsOther } from '../charts.utils';
import { i18n } from '../../../theme/i18n/i18n';

// -- mocks -------------------------------------------------------------------

vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => ['#c0', '#c1', '#c2', '#c3', '#c4']),
}));

vi.mock('../../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(
    ({ color, index }: { color: string; index: number }) => `${color}-${index}`,
  ),
}));

vi.mock('../../../theme/formatter/formatter.utils', () => ({
  // By default: returns "fmt:<value>" so value !== formattedValue (no i18n fallback)
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_dim: unknown, value: unknown) => `fmt:${value}`),
  })),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

vi.mock('../charts.utils', () => ({
  groupTailAsOther: vi.fn((data: unknown[]) => data),
}));

// -- helpers -----------------------------------------------------------------

const makeDimension = (name = 'category'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'value'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

const makeTheme = (charts: Record<string, unknown> = {}) => ({ charts }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ----------------------------------------------------------------------------

describe('getPieChartProData', () => {
  const dimension = makeDimension('category');
  const measure = makeMeasure('value');
  const theme = makeTheme();

  it('returns empty labels and datasets when data is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getPieChartProData({ data: undefined as any, dimension, measure });
    expect(result).toEqual({ labels: [], datasets: [{ data: [] }] });
  });

  it('maps data rows to labels using the formatter', () => {
    const data = [
      { category: 'Apple', value: 10 },
      { category: 'Banana', value: 20 },
    ];

    const result = getPieChartProData({ data, dimension, measure }, theme);

    // Default mock returns "fmt:<value>", which differs from raw value → no i18n fallback
    expect(result.labels).toEqual(['fmt:Apple', 'fmt:Banana']);
  });

  it('falls back to i18n translation when formatter returns the raw value unchanged', () => {
    // Override: formatter returns the raw value → triggers i18n path
    vi.mocked(getThemeFormatter).mockReturnValueOnce({
      data: vi.fn((_dim: unknown, v: unknown) => String(v)),
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const data = [{ category: 'some_key', value: 5 }];
    const result = getPieChartProData({ data, dimension, measure }, theme);

    expect(vi.mocked(i18n.t)).toHaveBeenCalledWith('some_key');
    expect(result.labels?.[0]).toBe('t(some_key)');
  });

  it('maps data rows to measure values in the dataset', () => {
    const data = [
      { category: 'A', value: 42 },
      { category: 'B', value: 7 },
    ];

    const result = getPieChartProData({ data, dimension, measure }, theme);

    expect(result.datasets[0].data).toEqual([42, 7]);
  });

  it('generates backgroundColor and borderColor arrays of the correct length', () => {
    const data = [
      { category: 'X', value: 1 },
      { category: 'Y', value: 2 },
      { category: 'Z', value: 3 },
    ];

    const result = getPieChartProData({ data, dimension, measure }, theme);

    expect(result.datasets[0].backgroundColor).toHaveLength(3);
    expect(result.datasets[0].borderColor).toHaveLength(3);
  });

  it('requests background and border colors via getDimensionMeasureColor', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();
    const data = [{ category: 'A', value: 1 }];

    getPieChartProData({ data, dimension, measure }, theme);

    const colorTypes = vi
      .mocked(getDimensionMeasureColor)
      .mock.calls.map(([args]) => (args as { color: string }).color);
    expect(colorTypes).toContain('background');
    expect(colorTypes).toContain('border');
  });

  it('passes maxLegendItems to groupTailAsOther', () => {
    const data = [{ category: 'A', value: 1 }];

    getPieChartProData({ data, dimension, measure, maxLegendItems: 3 }, theme);

    expect(vi.mocked(groupTailAsOther)).toHaveBeenCalledWith(data, dimension, [measure], 3);
  });
});

// ----------------------------------------------------------------------------

describe('getPieChartProOptions', () => {
  const measure = makeMeasure('revenue');

  it('uses legendPosition from theme', () => {
    const options = getPieChartProOptions(measure, makeTheme({ legendPosition: 'right' }));
    expect(options.plugins?.legend?.position).toBe('right');
  });

  it('defaults legendPosition to "bottom" when theme does not specify one', () => {
    const options = getPieChartProOptions(measure, makeTheme({}));
    expect(options.plugins?.legend?.position).toBe('bottom');
  });

  it('datalabels formatter delegates to themeFormatter.data', () => {
    const dataFn = vi.fn(() => '42');
    vi.mocked(getThemeFormatter).mockReturnValueOnce({ data: dataFn } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const options = getPieChartProOptions(measure, makeTheme());
    const formatter = options.plugins?.datalabels?.formatter as (v: unknown) => string;
    formatter(42);

    expect(dataFn).toHaveBeenCalledWith(measure, 42);
  });

  it('tooltip label formats raw value and shows percentage', () => {
    vi.mocked(getThemeFormatter).mockReturnValueOnce({
      data: vi.fn((_m: unknown, v: unknown) => `$${v}`),
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const options = getPieChartProOptions(measure, makeTheme());
    const labelFn = options.plugins?.tooltip?.callbacks?.label as (ctx: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any

    // raw = 25, total = 100 → 25 %
    const result = labelFn({ raw: 25, dataset: { data: [25, 25, 25, 25] } });

    expect(result).toBe('$25 (25%)');
  });

  it('tooltip label rounds the percentage', () => {
    vi.mocked(getThemeFormatter).mockReturnValueOnce({
      data: vi.fn((_m: unknown, v: unknown) => String(v)),
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const options = getPieChartProOptions(measure, makeTheme());
    const labelFn = options.plugins?.tooltip?.callbacks?.label as (ctx: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any

    // 1 / 3 = 33.33… → rounds to 33 %
    const result = labelFn({ raw: 1, dataset: { data: [1, 1, 1] } });

    expect(result).toBe('1 (33%)');
  });
});
