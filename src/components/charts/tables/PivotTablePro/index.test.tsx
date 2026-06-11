import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import PivotTablePro from './index';
import type { PivotTableProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';

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
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  PivotTable: () => <div data-testid="pivot-table" />,
}));

vi.mock('./PivotPro.utils', () => ({
  getPivotMeasures: vi.fn(() => []),
  getPivotDimension: vi.fn(() => ({})),
  getPivotColumnTotalsFor: vi.fn(() => []),
  getPivotRowTotalsFor: vi.fn(() => []),
}));

vi.mock('../tables.hooks', () => ({
  useGetTableSortedResults: vi.fn((args: { results: DataResponse }) => args.results),
}));

vi.mock('../../../../utils/array.utils', () => ({
  sortArrayByProp: vi.fn((arr: unknown[]) => arr),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const rowDimension = { name: 'row', inputs: {} } as unknown as Dimension;
const columnDimension = { name: 'col', inputs: {} } as unknown as Dimension;
const measure = { name: 'value', inputs: {} } as unknown as Measure;

const defaultProps: PivotTableProProps = {
  rowDimension,
  columnDimension,
  measures: [measure],
  results: emptyResults,
  expandedRowKeys: [],
  setExpandedRowKey: vi.fn(),
};

describe('PivotTablePro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard', () => {
    render(<PivotTablePro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<PivotTablePro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders PivotTable', () => {
    render(<PivotTablePro {...defaultProps} />);
    expect(screen.getByTestId('pivot-table')).toBeInTheDocument();
  });
});
