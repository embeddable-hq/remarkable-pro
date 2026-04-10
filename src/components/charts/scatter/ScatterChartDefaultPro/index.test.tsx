import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import ScatterChartDefaultPro from './index';

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
