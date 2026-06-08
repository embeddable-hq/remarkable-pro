import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure, TimeRange } from '@embeddable.com/core';
import LineChartComparisonDefaultPro from './index';
import type { LineChartComparisonDefaultProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
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

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('./LineChartComparisonDefaultPro.utils', () => ({
  createComparisonClickHandler: vi.fn(() => vi.fn()),
  getLineChartComparisonProData: vi.fn(() => ({ datasets: [] })),
  getLineChartComparisonProOptions: vi.fn(() => ({})),
}));

vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(() => ({})),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => <div data-testid="granularity-select" />,
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const xAxis = { name: 'date', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;
const dateRange = {} as unknown as TimeRange;

const defaultProps: LineChartComparisonDefaultProProps = {
  xAxis,
  measures: [measure],
  results: emptyResults,
  resultsComparison: emptyResults,
  primaryDateRange: dateRange,
  comparisonDateRange: dateRange,
};

describe('LineChartComparisonDefaultPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard', () => {
    render(<LineChartComparisonDefaultPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<LineChartComparisonDefaultPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders LineChart', () => {
    render(<LineChartComparisonDefaultPro {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
