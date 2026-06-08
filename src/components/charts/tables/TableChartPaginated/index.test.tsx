import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import TableChartPaginatedPro from './index';
import type { TableChartPaginatedProProps } from './index';

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
  TablePaginated: () => <div data-testid="table-paginated" />,
  getStyleNumber: vi.fn(() => 40),
  getTableTotalPages: vi.fn(() => 1),
  useTableGetRowsPerPage: vi.fn(() => 10),
  useResizeObserver: vi.fn(() => ({ height: 400 })),
}));

vi.mock('../tables.utils', () => ({
  getTableHeaders: vi.fn(() => []),
  getTableRows: vi.fn(() => []),
}));

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(() => undefined),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const dimension = { name: 'category', inputs: {} } as unknown as Dimension;
const dimensionsAndMeasures: DimensionOrMeasure[] = [dimension];

const defaultProps: TableChartPaginatedProProps = {
  dimensionsAndMeasures,
  results: emptyResults,
};

describe('TableChartPaginatedPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<TableChartPaginatedPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<TableChartPaginatedPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders TablePaginated', () => {
    render(<TableChartPaginatedPro {...defaultProps} />);
    expect(screen.getByTestId('table-paginated')).toBeInTheDocument();
  });
});
