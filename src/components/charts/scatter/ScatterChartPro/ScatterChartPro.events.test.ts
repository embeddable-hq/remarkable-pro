import { describe, it, expect } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { getPointClickData } from './ScatterChartPro.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(),
  getStyleNumber: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'point',
    title: 'Point',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as Dimension;

const makeMeasure = (name: string): Measure =>
  ({ name, title: name, nativeType: 'number', inputs: {} }) as unknown as Measure;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDatasets = (rowIndex: number) => [{ data: [{ rowIndex }] }] as any;

describe('getPointClickData user interaction values', () => {
  const xMeasure = makeMeasure('xVal');
  const yMeasure = makeMeasure('yVal');

  it('nulls out point/group values and returns time ranges for time dimensions', () => {
    const result = getPointClickData(
      { datasetIndex: 0, index: 0 },
      makeDatasets(0),
      [{ point: '2024-01-01', xVal: 10, yVal: 20, g: '2024-02-01' }],
      xMeasure,
      yMeasure,
      makeDimension({ name: 'point', nativeType: 'time' }),
      makeDimension({ name: 'g', nativeType: 'time' }),
    );

    expect(result?.pointDimensionValue).toBeUndefined();
    expect(result?.groupByDimensionValue).toBeUndefined();
    expect(result?.pointDimensionTimeRange).toBeDefined();
    expect(result?.groupByDimensionTimeRange).toBeDefined();
  });
});
