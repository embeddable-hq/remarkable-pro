import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Measure } from '@embeddable.com/core';
import KpiChartNumberPro from './index';
import type { KpiChartNumberProProp } from './index';

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

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;

const defaultProps: KpiChartNumberProProp = {
  measure,
  results: emptyResults,
};

describe('KpiChartNumberPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<KpiChartNumberPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<KpiChartNumberPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders KpiChart', () => {
    render(<KpiChartNumberPro {...defaultProps} />);
    expect(screen.getByTestId('kpi-chart')).toBeInTheDocument();
  });
});
