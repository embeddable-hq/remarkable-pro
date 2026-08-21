import { render, screen, fireEvent } from '@testing-library/react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TablePaginated: ({ onRowIndexClick }: Record<string, any>) => (
    <div data-testid="table-paginated">
      <button data-testid="row-click" onClick={() => onRowIndexClick?.(0)}>
        row
      </button>
    </div>
  ),
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

  it('passes menuOptions to ChartCard when provided', () => {
    render(<TableChartPaginatedPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders TablePaginated', () => {
    render(<TableChartPaginatedPro {...defaultProps} />);
    expect(screen.getByTestId('table-paginated')).toBeInTheDocument();
  });

  describe('row clicks', () => {
    const clickDimension = {
      name: 'category',
      __type__: 'dimension',
      inputs: {},
    } as unknown as Dimension;
    const measure = {
      name: 'sales',
      __type__: 'measure',
      inputs: {},
    } as unknown as DimensionOrMeasure;
    const rowResults = {
      data: [{ category: 'A', sales: 10 }],
      isLoading: false,
    } as unknown as DataResponse;

    it('dispatches a user interaction event and calls onRowClicked with the row value', () => {
      const onRowClicked = vi.fn();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      render(
        <TableChartPaginatedPro
          {...defaultProps}
          results={rowResults}
          dimensionsAndMeasures={[clickDimension as unknown as DimensionOrMeasure, measure]}
          clickDimension={clickDimension}
          onRowClicked={onRowClicked}
        />,
      );

      fireEvent.click(screen.getByTestId('row-click'));

      expect(onRowClicked).toHaveBeenCalledWith({
        dimensionValue: 'A',
        dimensionTimeRange: undefined,
      });
      const event = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
      expect(event.type).toBe('embeddable-user-interaction');
      expect(event.detail).toMatchObject({
        dimensionClickValue: 'A',
        measureValues: { sales: 10 },
        dimensionValues: { category: 'A' },
      });
    });

    it('nulls out the dimension value when the clicked dimension resolves to a time range', async () => {
      const range = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        relativeTimeString: undefined,
      };
      const { getTimeRangeFromDimensionValue } = await import('../../../utils/dimension.utils');
      vi.mocked(getTimeRangeFromDimensionValue).mockReturnValueOnce(range);

      const onRowClicked = vi.fn();
      render(
        <TableChartPaginatedPro
          {...defaultProps}
          results={rowResults}
          dimensionsAndMeasures={[clickDimension as unknown as DimensionOrMeasure, measure]}
          clickDimension={clickDimension}
          onRowClicked={onRowClicked}
        />,
      );

      fireEvent.click(screen.getByTestId('row-click'));

      expect(onRowClicked).toHaveBeenCalledWith({
        dimensionValue: undefined,
        dimensionTimeRange: range,
      });
    });

    it('dispatches but does not call onRowClicked when no clickDimension is set', () => {
      const onRowClicked = vi.fn();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      render(
        <TableChartPaginatedPro
          {...defaultProps}
          results={rowResults}
          dimensionsAndMeasures={[clickDimension as unknown as DimensionOrMeasure, measure]}
          onRowClicked={onRowClicked}
        />,
      );

      fireEvent.click(screen.getByTestId('row-click'));

      expect(onRowClicked).not.toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});
