import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import BarChartStackedHorizontalPro from './index';
import type { BarChartStackedHorizontalProProps } from './index';
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
  getBarStackedChartProData: vi.fn(() => ({ datasets: [] })),
  getBarStackedChartProOptions: vi.fn(() => ({})),
}));

vi.mock('../../charts.utils', () => ({
  createGroupedClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../bars.hooks', () => ({
  useUpdateAxisOrderAndCacheKey: vi.fn(),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => <div data-testid="granularity-select" />,
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const yAxis = { name: 'category', inputs: {} } as unknown as Dimension;
const groupBy = { name: 'group', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;

const defaultProps: BarChartStackedHorizontalProProps = {
  yAxis,
  groupBy,
  measure,
  results: emptyResults,
};

describe('BarChartStackedHorizontalPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard', () => {
    render(<BarChartStackedHorizontalPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<BarChartStackedHorizontalPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders BarChart', () => {
    render(<BarChartStackedHorizontalPro {...defaultProps} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
