import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '@embeddable.com/react';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import FunnelChartPro from './index';
import type { FunnelChartProProps } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({ charts: { funnelChartPro: {} } })),
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
      menuOptions,
      dimensionsAndMeasures,
    }: {
      children: React.ReactNode;
      menuOptions?: (string | unknown)[];
      dimensionsAndMeasures?: unknown[];
    }) => (
      <div
        data-testid="chart-card"
        {...(menuOptions ? { 'data-menu-options': JSON.stringify(menuOptions) } : {})}
        data-dimensions-and-measures-count={dimensionsAndMeasures?.length ?? 0}
      >
        {children}
      </div>
    ),
  ),
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  FunnelChart: ({
    showPercentage,
    legendPosition,
  }: {
    showPercentage?: boolean;
    legendPosition?: string;
  }) => (
    <div
      data-testid="funnel-chart"
      data-show-percentage={String(Boolean(showPercentage))}
      data-legend-position={legendPosition}
    />
  ),
}));

vi.mock('../funnel.utils', () => ({
  getFunnelChartProData: vi.fn(() => ({ labels: [], datasets: [{ data: [] }] })),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const stageDimension = { name: 'severity', inputs: {} } as unknown as Dimension;
const countMeasure = { name: 'count', inputs: {} } as unknown as Measure;
const orderDimension = { name: 'severity_order', inputs: {} } as unknown as Dimension;

const defaultProps: FunnelChartProProps = {
  stageDimension,
  countMeasure,
  results: emptyResults,
};

describe('FunnelChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({ charts: { funnelChartPro: {} } } as never);
  });

  it('renders ChartCard', () => {
    render(<FunnelChartPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard when provided', () => {
    render(<FunnelChartPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders FunnelChart', () => {
    render(<FunnelChartPro {...defaultProps} />);
    expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
  });

  it('passes showPercentage through to FunnelChart', () => {
    render(<FunnelChartPro {...defaultProps} showPercentage={true} />);
    expect(screen.getByTestId('funnel-chart')).toHaveAttribute('data-show-percentage', 'true');
  });

  it('defaults legendPosition to bottom when the theme does not specify one', () => {
    render(<FunnelChartPro {...defaultProps} />);
    expect(screen.getByTestId('funnel-chart')).toHaveAttribute('data-legend-position', 'bottom');
  });

  it('passes legendPosition through when the theme sets it to right', () => {
    vi.mocked(useTheme).mockReturnValue({
      charts: { funnelChartPro: {}, legendPosition: 'right' },
    } as never);

    render(<FunnelChartPro {...defaultProps} />);
    expect(screen.getByTestId('funnel-chart')).toHaveAttribute('data-legend-position', 'right');
  });

  it('falls back to bottom when the theme legendPosition is not supported by the funnel chart', () => {
    vi.mocked(useTheme).mockReturnValue({
      charts: { funnelChartPro: {}, legendPosition: 'top' },
    } as never);

    render(<FunnelChartPro {...defaultProps} />);
    expect(screen.getByTestId('funnel-chart')).toHaveAttribute('data-legend-position', 'bottom');
  });

  it('includes orderDimension in dimensionsAndMeasures when provided', () => {
    render(<FunnelChartPro {...defaultProps} orderDimension={orderDimension} />);
    const card = screen.getByTestId('chart-card');
    expect(card).toHaveAttribute('data-dimensions-and-measures-count', '3');
  });

  it('excludes orderDimension from dimensionsAndMeasures when not provided', () => {
    render(<FunnelChartPro {...defaultProps} />);
    const card = screen.getByTestId('chart-card');
    expect(card).toHaveAttribute('data-dimensions-and-measures-count', '2');
  });
});
