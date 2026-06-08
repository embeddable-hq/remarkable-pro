import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import DonutLabelChartPro from './index';
import type { DonutLabelChartProProps } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({ charts: { donutLabelChartPro: {} } })),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
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
  pickChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  DonutChart: () => <div data-testid="donut-chart" />,
}));

vi.mock('../pies.utils', () => ({
  getPieChartProData: vi.fn(() => ({ datasets: [] })),
  getPieChartProOptions: vi.fn(() => ({})),
  createPieClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn(() => ''),
  })),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const dimension = { name: 'category', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;
const innerLabelMeasure = { name: 'total', inputs: {} } as unknown as Measure;

const defaultProps: DonutLabelChartProProps = {
  dimension,
  measure,
  results: emptyResults,
  innerLabelMeasure,
  resultsInnerLabel: emptyResults,
};

describe('DonutLabelChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<DonutLabelChartPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<DonutLabelChartPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders DonutChart', () => {
    render(<DonutLabelChartPro {...defaultProps} />);
    expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
  });
});
