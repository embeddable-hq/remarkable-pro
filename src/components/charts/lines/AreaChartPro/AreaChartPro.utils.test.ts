import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import { getAreaChartProData, getAreaChartProOptions } from './AreaChartPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation } from '../../charts.utils';

vi.mock('../LineChartDefaultPro/LineChartDefaultPro.utils', () => ({
  getLineChartProData: vi.fn(),
  getLineChartProOptions: vi.fn(),
}));
vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => []),
  getStyleNumber: vi.fn(() => 5),
}));
vi.mock('../../charts.utils', () => ({ getDimensionWithoutTruncation: vi.fn((d) => d) }));
vi.mock('../../../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(() => '#000'),
}));
vi.mock('../../../../utils/color.utils', () => ({
  isColorValid: vi.fn(() => false),
  setColorAlpha: vi.fn((c: string) => c),
}));
vi.mock('mergician', () => ({
  mergician: vi.fn((...args: object[]) => Object.assign({}, ...args)),
}));

import {
  getLineChartProData,
  getLineChartProOptions,
} from '../LineChartDefaultPro/LineChartDefaultPro.utils';

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

const makeMockFormatter = () => ({
  data: vi.fn((_: unknown, value: unknown) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: { title: string }) => m.title),
});

const makeChartData = (labels: string[], datasets: { data: number[] }[] = []) => ({
  labels,
  datasets,
});

// ----------------------------------------------------------------------------

describe('getAreaChartProData', () => {
  beforeEach(() => {
    const mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
  });

  it('sets fill: true on every dataset', () => {
    vi.mocked(getLineChartProData).mockReturnValue({
      labels: ['Jan', 'Feb'],
      datasets: [
        { data: [100, 200], label: 'Revenue', fill: false },
        { data: [50, 75], label: 'Costs', fill: false },
      ],
    } as never);

    const result = getAreaChartProData(
      {
        data: [
          { date: 'Jan', revenue: 100 },
          { date: 'Feb', revenue: 200 },
        ],
        dimension: makeDimension(),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets.every((ds) => ds.fill === true)).toBe(true);
  });

  it('preserves all other dataset properties when setting fill', () => {
    vi.mocked(getLineChartProData).mockReturnValue({
      labels: ['Jan'],
      datasets: [{ data: [100], label: 'Revenue', borderColor: '#ff0000' }],
    } as never);

    const result = getAreaChartProData(
      {
        data: [{ date: 'Jan', revenue: 100 }],
        dimension: makeDimension(),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]).toMatchObject({
      data: [100],
      label: 'Revenue',
      borderColor: '#ff0000',
      fill: true,
    });
  });

  it('preserves labels from the underlying line chart data', () => {
    vi.mocked(getLineChartProData).mockReturnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ data: [1, 2, 3] }],
    } as never);

    const result = getAreaChartProData(
      {
        data: [],
        dimension: makeDimension(),
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('delegates to getLineChartProData with the same props and theme', () => {
    vi.mocked(getLineChartProData).mockReturnValue({ labels: [], datasets: [] } as never);

    const props = {
      data: [{ date: 'Jan', revenue: 42 }],
      dimension: makeDimension(),
      measures: [makeMeasure()],
      hasMinMaxYAxisRange: true,
    };
    const theme = makeTheme();

    getAreaChartProData(props, theme);

    expect(getLineChartProData).toHaveBeenCalledWith(props, theme);
  });
});

// ----------------------------------------------------------------------------

describe('getAreaChartProOptions', () => {
  beforeEach(() => {
    const mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionWithoutTruncation).mockImplementation((d) => d);
    vi.mocked(getLineChartProOptions).mockReturnValue({ scales: { x: {}, y: {} } } as never);
  });

  it('sets scales.y.stacked to true', () => {
    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        measures: [makeMeasure()],
        data: makeChartData([]) as never,
      },
      makeTheme(),
    );

    expect(result.scales?.y?.stacked).toBe(true);
  });

  it('delegates to getLineChartProOptions with the same options and theme', () => {
    const options = {
      dimension: makeDimension(),
      measures: [makeMeasure()],
      data: makeChartData([]) as never,
    };
    const theme = makeTheme();

    getAreaChartProOptions(options, theme);

    expect(getLineChartProOptions).toHaveBeenCalledWith(options, theme);
  });

  it('merges areaChartDefaultPro theme options when provided', () => {
    const theme = {
      charts: {
        areaChartDefaultPro: { options: { animation: false } },
      },
    } as never;

    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        measures: [makeMeasure()],
        data: makeChartData([]) as never,
      },
      theme,
    );

    expect((result as { animation?: unknown }).animation).toBe(false);
  });

  it('works without areaChartDefaultPro theme options defined', () => {
    const result = getAreaChartProOptions(
      {
        dimension: makeDimension(),
        measures: [makeMeasure()],
        data: makeChartData([]) as never,
      },
      makeTheme(),
    );

    expect(result.scales).toBeDefined();
  });
});
