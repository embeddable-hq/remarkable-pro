import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import ScatterChartPro from './index';
import type { ScatterChartProProps } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({ charts: { scatterChartPro: {} } })),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn(() => '') },
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: vi.fn((props) => props),
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: vi.fn(
    ({
      children,
      exportOptions,
    }: {
      children: React.ReactNode;
      exportOptions?: (string | unknown)[];
    }) => (
      <div
        data-testid="chart-card"
        {...(exportOptions ? { 'data-export-options': JSON.stringify(exportOptions) } : {})}
      >
        {children}
      </div>
    ),
  ),
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  ScatterChart: () => <div data-testid="scatter-chart" />,
}));

vi.mock('./ScatterChartPro.utils', () => ({
  createScatterClickHandler: vi.fn(() => vi.fn()),
  getScatterChartProData: vi.fn(() => ({ datasets: [] })),
  getScatterChartProOptions: vi.fn(() => ({})),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const pointDimension = { name: 'point', inputs: {} } as unknown as Dimension;
const xMeasure = { name: 'x', inputs: {} } as unknown as Measure;
const yMeasure = { name: 'y', inputs: {} } as unknown as Measure;

const defaultProps: ScatterChartProProps = {
  xMeasure,
  yMeasure,
  pointDimension,
  results: emptyResults,
};

describe('ScatterChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<ScatterChartPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<ScatterChartPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders ScatterChart', () => {
    render(<ScatterChartPro {...defaultProps} />);
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });
});
