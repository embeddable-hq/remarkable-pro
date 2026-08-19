import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    }: {
      children: React.ReactNode;
      menuOptions?: (string | unknown)[];
    }) => (
      <div
        data-testid="chart-card"
        {...(menuOptions ? { 'data-menu-options': JSON.stringify(menuOptions) } : {})}
      >
        {children}
      </div>
    ),
  ),
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  FunnelChart: () => <div data-testid="funnel-chart" />,
}));

vi.mock('../funnel.utils', () => ({
  getFunnelChartProData: vi.fn(() => ({ labels: [], datasets: [{ data: [] }] })),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const stageDimension = { name: 'severity', inputs: {} } as unknown as Dimension;
const countMeasure = { name: 'count', inputs: {} } as unknown as Measure;

const defaultProps: FunnelChartProProps = {
  stageDimension,
  countMeasure,
  results: emptyResults,
};

describe('FunnelChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
