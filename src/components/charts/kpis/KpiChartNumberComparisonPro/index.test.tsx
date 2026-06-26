import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Measure, TimeRange } from '@embeddable.com/core';
import KpiChartNumberComparisonPro from './index';
import type { KpiChartNumberComparisonProProp } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
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
  KpiChart: () => <div data-testid="kpi-chart" />,
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn(() => ''),
  })),
}));

vi.mock('../kpis.utils', () => ({
  getKpiResults: vi.fn((results: DataResponse) => results),
}));

vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(() => ({})),
  getComparisonPeriodLabel: vi.fn(() => ''),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;
const dateRange = {} as unknown as TimeRange;

const defaultProps: KpiChartNumberComparisonProProp = {
  measure,
  results: emptyResults,
  resultsComparison: emptyResults,
  primaryDateRange: dateRange,
  comparisonDateRange: dateRange,
};

describe('KpiChartNumberComparisonPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<KpiChartNumberComparisonPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard when provided', () => {
    render(<KpiChartNumberComparisonPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders KpiChart', () => {
    render(<KpiChartNumberComparisonPro {...defaultProps} />);
    expect(screen.getByTestId('kpi-chart')).toBeInTheDocument();
  });
});
