import type { Dimension, Measure } from '@embeddable.com/core';
import { getScatterChartProData, measureToNullableNumber } from './ScatterChartDefaultPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'point',
    title: 'Point',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as Dimension;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (name: string, overrides: Record<string, any> = {}): Measure =>
  ({
    name,
    title: name,
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const makeTheme = () => ({ charts: { legendPosition: 'bottom' } }) as never;

const makeMockFormatter = () => ({
  data: vi.fn((_, value) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: Measure) => m.title ?? m.name),
});

describe('measureToNullableNumber', () => {
  it('returns null for nullish and non-finite numbers', () => {
    expect(measureToNullableNumber(null)).toBeNull();
    expect(measureToNullableNumber(undefined)).toBeNull();
    expect(measureToNullableNumber(Number.NaN)).toBeNull();
    expect(measureToNullableNumber('x')).toBeNull();
  });

  it('parses finite numbers', () => {
    expect(measureToNullableNumber(3)).toBe(3);
    expect(measureToNullableNumber('12.5')).toBe(12.5);
  });
});

describe('getScatterChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
  });

  it('returns empty dataset when there are no rows', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.chartData.datasets[0]!.data).toEqual([]);
    expect(result.rowIndexByPoint).toEqual([[]]);
  });

  it('maps null measures and null point dimension to labels', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [{ point: null, x: null, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    const pt = result.chartData.datasets[0]!.data[0]!;
    expect(pt?.x).toBeNull();
    expect(pt?.y).toBe(2);
    expect(pt?.pointLabel).toBe('NV');
    expect(result.rowIndexByPoint[0]).toEqual([0]);
  });

  it('splits rows into datasets by group-by and places null group last in order', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'g', title: 'G' });

    const result = getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, g: 'B' },
          { point: 'P2', x: 2, y: 2, g: null },
          { point: 'P3', x: 3, y: 3, g: 'A' },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.chartData.datasets).toHaveLength(3);
    expect(result.chartData.datasets.map((d) => d.label)).toEqual(['fmt:A', 'fmt:B', 'NV']);
    expect(result.rowIndexByPoint).toEqual([[2], [0], [1]]);
  });

  it('applies manual point color for a single series', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();

    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
        pointColor: '#abc',
      },
      makeTheme(),
    );

    expect(result.chartData.datasets[0]!.pointBackgroundColor).toBe('#abc');
    expect(result.chartData.datasets[0]!.pointBorderColor).toBe('#abc');
    expect(getDimensionMeasureColor).not.toHaveBeenCalled();
  });

  it('applies manual point color across grouped series', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'g' });

    const result = getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, g: 'A' },
          { point: 'P2', x: 2, y: 2, g: 'B' },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
        pointColor: '#fed',
      },
      makeTheme(),
    );

    expect(result.chartData.datasets[0]!.pointBackgroundColor).toBe('#fed');
    expect(result.chartData.datasets[1]!.pointBackgroundColor).toBe('#fed');
  });
});
