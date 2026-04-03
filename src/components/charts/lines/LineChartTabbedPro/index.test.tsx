import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LineChartTabbedPro from './index';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: (props: Record<string, unknown>) => props,
}));

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: (props: { results: DataResponse }) => props.results,
}));

const mockChartData = { labels: [], datasets: [{ data: [] }] };
const mockChartOptions = {};

vi.mock('./LineChartTabbedPro.utils', () => ({
  getLineChartProData: vi.fn(() => mockChartData),
  getLineChartProOptions: vi.fn(() => mockChartOptions),
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: ({
    children,
    title,
    description,
    tooltip,
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
    tooltip?: string;
  }) => (
    <div
      data-testid="chart-card"
      data-title={title}
      data-description={description}
      data-tooltip={tooltip}
    >
      {children}
    </div>
  ),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: ({ dimension }: { dimension: Dimension }) => (
    <div data-testid="granularity-select" data-dimension={dimension.name} />
  ),
}));

vi.mock('./components/MeasureTabs', () => ({
  MeasureTabs: ({
    measures,
    activeMeasureIndex,
  }: {
    measures: Measure[];
    activeMeasureIndex: number;
  }) => (
    <div data-testid="measure-tabs" data-count={measures.length} data-active={activeMeasureIndex} />
  ),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

const makeDimension = (name = 'date'): Dimension =>
  ({ name, title: 'Date', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name: string, title: string): Measure =>
  ({ name, title, nativeType: 'number', inputs: {} }) as unknown as Measure;

const makeDataResponse = (
  data: Record<string, unknown>[] | undefined = [],
  isLoading = false,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

const defaultProps = {
  xAxis: makeDimension(),
  measures: [makeMeasure('revenue', 'Revenue'), makeMeasure('cost', 'Cost')],
  results: makeDataResponse([{ date: '2024-01', revenue: 100, cost: 50 }]),
  resultsTotals: makeDataResponse([{ revenue: 100, cost: 50 }]),
};

describe('LineChartTabbedPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard with title, description, and tooltip', () => {
    render(
      <LineChartTabbedPro
        {...defaultProps}
        title="My Chart"
        description="Chart description"
        tooltip="Chart tooltip"
      />,
    );

    const card = screen.getByTestId('chart-card');
    expect(card).toHaveAttribute('data-title', 'My Chart');
    expect(card).toHaveAttribute('data-description', 'Chart description');
    expect(card).toHaveAttribute('data-tooltip', 'Chart tooltip');
  });

  it('renders MeasureTabs with all measures and activeMeasureIndex=0 by default', () => {
    render(<LineChartTabbedPro {...defaultProps} />);

    const tabs = screen.getByTestId('measure-tabs');
    expect(tabs).toHaveAttribute('data-count', '2');
    expect(tabs).toHaveAttribute('data-active', '0');
  });

  it('renders ChartGranularitySelectField when setGranularity is provided', () => {
    render(<LineChartTabbedPro {...defaultProps} setGranularity={vi.fn()} />);

    expect(screen.getByTestId('granularity-select')).toBeInTheDocument();
  });

  it('does not render ChartGranularitySelectField when setGranularity is undefined', () => {
    render(<LineChartTabbedPro {...defaultProps} />);

    expect(screen.queryByTestId('granularity-select')).not.toBeInTheDocument();
  });

  it('renders LineChart', () => {
    render(<LineChartTabbedPro {...defaultProps} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders without crashing when results are loading', () => {
    render(
      <LineChartTabbedPro
        {...defaultProps}
        results={makeDataResponse(undefined, true)}
        resultsTotals={makeDataResponse(undefined, true)}
      />,
    );

    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });
});
