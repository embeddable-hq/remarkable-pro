import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import BarChartDefaultPro from './index';
import type { BarChartDefaultProProps } from './index';
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
  BarChart: () => <div data-testid="bar-chart" />,
}));

vi.mock('../bars.utils', () => ({
  getBarChartProData: vi.fn(() => ({})),
  getBarChartProOptions: vi.fn(() => ({})),
}));

vi.mock('../../charts.utils', () => ({
  createSimpleClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => <div data-testid="granularity-select" />,
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const dimension = { name: 'date', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;

const defaultProps: BarChartDefaultProProps = {
  dimension,
  measures: [measure],
  results: emptyResults,
};

describe('BarChartDefaultPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard and BarChart', () => {
    render(<BarChartDefaultPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard', () => {
    render(<BarChartDefaultPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('passes no exportOptions to ChartCard when not provided', () => {
    render(<BarChartDefaultPro {...defaultProps} />);
    const card = screen.getByTestId('chart-card');
    // exportOptions is undefined (not set), so JSON.stringify renders 'undefined'
    expect(card.getAttribute('data-export-options')).toBeNull();
  });

  it('renders granularity selector when setGranularity is provided', () => {
    render(<BarChartDefaultPro {...defaultProps} setGranularity={vi.fn()} />);
    expect(screen.getByTestId('granularity-select')).toBeInTheDocument();
  });
});
