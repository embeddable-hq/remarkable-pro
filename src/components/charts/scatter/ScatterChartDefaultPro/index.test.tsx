import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, DimensionOrMeasure, Measure } from '@embeddable.com/core';
import type { Theme } from '../../../../theme/theme.types';
import type { TooltipItem } from 'chart.js';
import type { ScatterDatasetWithOriginal } from '@embeddable.com/remarkable-ui';
import ScatterChartDefaultPro, { getScatterChartProOptions } from './index';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../../theme/formatter/formatter.utils';

let lastScatterProps: Record<string, unknown> | null = null;

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_, value: unknown) => `fmt:${String(value)}`),
    dimensionOrMeasureTitle: vi.fn((m: Measure) => m.title ?? m.name),
  })),
}));

vi.mock('../../../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(({ color, index }: { color: string; index: number }) =>
    color === 'background' ? `#bg-${index}` : `#bd-${index}`,
  ),
}));

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({
    charts: {
      scatterChartDefaultPro: { options: {} },
    },
  })),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => ['#111111', '#222222']),
  ScatterChart: (props: Record<string, unknown>) => {
    lastScatterProps = props;
    return <div data-testid="scatter-chart" />;
  },
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-card">{children}</div>
  ),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
  i18nSetup: vi.fn(),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (name: string, overrides: Record<string, any> = {}): Measure =>
  ({
    name,
    title: name,
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const xMeasure = { name: 'x', title: 'X', nativeType: 'number', inputs: {} } as unknown as Measure;
const yMeasure = { name: 'y', title: 'Y', nativeType: 'number', inputs: {} } as unknown as Measure;
const NO_VALUE = 'No value';

describe('getScatterChartProOptions', () => {
  let dataFn: GetThemeFormatter['data'];

  beforeEach(() => {
    dataFn = vi.fn(
      (m: DimensionOrMeasure, value: unknown) => `data:${m.name}:${value}`,
    ) as GetThemeFormatter['data'];

    vi.mocked(getThemeFormatter).mockReturnValue({
      string: (key) => key,
      number: (v) => String(v),
      dateTime: (d) => d.toISOString(),
      dimensionOrMeasureTitle: (key) => key.title ?? key.name,
      data: dataFn,
    });
  });

  describe('tick callbacks', () => {
    it('formats x axis ticks using themeFormatter.data with xMeasure', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(1_000_000)).toBe('data:x:1000000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xMeasure, 1_000_000);
    });

    it('formats y axis ticks using themeFormatter.data with yMeasure', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const yCb = opts.scales?.y?.ticks?.callback as (v: string | number) => string;

      expect(yCb(2)).toBe('data:y:2');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(yMeasure, 2);
    });

    it('uses the measure formatter for currency measures', () => {
      const xUsd = {
        name: 'revenue',
        title: 'Revenue',
        nativeType: 'number',
        inputs: { currency: 'USD' },
      } as unknown as Measure;

      const opts = getScatterChartProOptions({ xMeasure: xUsd, yMeasure }, {} as Theme, NO_VALUE);
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(25_000)).toBe('data:revenue:25000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xUsd, 25_000);
    });
  });

  describe('tooltip label', () => {
    it('formats tooltip using originalData when available', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: 'Series A',
          originalData: [{ x: 10, y: 20 }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 10, y: 20 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe('Series A: (data:x:10, data:y:20)');
    });

    it('returns noValueLabel for null measure values in tooltip', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: '',
          originalData: [{ x: null, y: null }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 0, y: 0 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe(`(${NO_VALUE}, ${NO_VALUE})`);
    });
  });
});

describe('ScatterChartDefaultPro', () => {
  beforeEach(() => {
    lastScatterProps = null;
  });

  it('passes click payload with JSON for object measure values', () => {
    const onPointClick = vi.fn();
    const row = {
      point: 'P',
      x: { nested: 1 },
      y: 2,
    };

    render(
      <ScatterChartDefaultPro
        xMeasure={makeMeasure('x')}
        yMeasure={makeMeasure('y')}
        pointDimension={makeDimension({ name: 'point' })}
        results={{ isLoading: false, data: [row] } as DataResponse}
        onPointClick={onPointClick}
      />,
    );

    const handler = lastScatterProps?.onPointClick as
      | ((hit: { datasetIndex: number; index: number } | undefined) => void)
      | undefined;
    expect(handler).toBeDefined();
    handler!({ datasetIndex: 0, index: 0 });

    expect(onPointClick).toHaveBeenCalledWith({
      xMeasureValue: JSON.stringify({ nested: 1 }),
      yMeasureValue: '2',
      pointDimensionValue: 'P',
      groupByDimensionValue: null,
    });
  });
});
