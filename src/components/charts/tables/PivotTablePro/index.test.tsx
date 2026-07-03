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
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
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

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  PivotTable: (props: Record<string, unknown>) => (
    <div
      data-testid="pivot-table"
      data-sum-label={String(props.sumLabel)}
      data-min-label={String(props.minLabel)}
      data-max-label={String(props.maxLabel)}
      data-average-label={String(props.averageLabel)}
    />
  ),
}));

vi.mock('./PivotPro.utils', () => ({
  getPivotMeasures: vi.fn(() => []),
  getPivotDimension: vi.fn(() => ({})),
  getPivotColumnAggregationsFor: vi.fn(() => ({})),
  getPivotRowAggregationsFor: vi.fn(() => ({})),
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

  it('passes menuOptions to ChartCard when provided', () => {
    render(<PivotTablePro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders PivotTable', () => {
    render(<PivotTablePro {...defaultProps} />);
    expect(screen.getByTestId('pivot-table')).toBeInTheDocument();
  });

  it('passes calculation labels resolved through i18n, not hardcoded English', () => {
    render(<PivotTablePro {...defaultProps} />);
    const pivotTable = screen.getByTestId('pivot-table');

    // The mocked i18n.t echoes back "t(<key>)", so this proves PivotTablePro asks i18n
    // for these specific keys instead of passing literal 'Sum' / 'Min' / etc.
    expect(pivotTable.getAttribute('data-sum-label')).toBe('t(charts.pivotTable.sum)');
    expect(pivotTable.getAttribute('data-min-label')).toBe('t(charts.pivotTable.min)');
    expect(pivotTable.getAttribute('data-max-label')).toBe('t(charts.pivotTable.max)');
    expect(pivotTable.getAttribute('data-average-label')).toBe('t(charts.pivotTable.average)');
  });
});
