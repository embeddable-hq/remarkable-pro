import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import { useEmbeddableLayout } from '@embeddable.com/react';
import TableScrollablePro from './index';
import type { TableScrollableProProps, TableScrollableProState } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
  useEmbeddableLayout: vi.fn(() => ({ heightMode: 'fixed' })),
  HEIGHT_MODES: { fixed: 'fixed', auto: 'auto' },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  // Returns the key, so the rendered label is identifiable and the counts assert on the call.
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: vi.fn((props) => props),
}));

// Marks what the theme formatter produced, so a browser-formatted count fails the assertion.
vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({ number: (value: number) => `[${value}]` })),
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
  TableScrollable: vi.fn(
    ({
      ref: _ref,
      onRowIndexClick,
      onNextPage,
      hasMoreData,
      ...rest
    }: {
      ref?: unknown;
      onRowIndexClick?: (rowIndex: number) => void;
      onNextPage?: () => void;
      hasMoreData?: boolean;
      [prop: string]: unknown;
    }) => (
      <div data-testid="table-scrollable" data-has-more-data={String(Boolean(hasMoreData))}>
        <button data-testid="row-click" onClick={() => onRowIndexClick?.(0)}>
          row
        </button>
        <button data-testid="next-page" onClick={() => onNextPage?.()}>
          next
        </button>
        <span data-rest={JSON.stringify(Object.keys(rest))} />
      </div>
    ),
  ),
}));

vi.mock('../tables.utils', () => ({
  getTableHeaders: vi.fn(() => []),
  getTableRows: vi.fn(() => []),
}));

vi.mock('./TableScrollable.utils', () => ({
  TABLE_SCROLLABLE_SIZE: 100,
}));

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(() => undefined),
}));

vi.mock('fast-equals', () => ({
  deepEqual: vi.fn(() => true),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const dimension = { name: 'category', inputs: {} } as unknown as Dimension;
const dimensionsAndMeasures: DimensionOrMeasure[] = [dimension];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataset = { variableValues: {} } as any;

const defaultProps: TableScrollableProProps = {
  dataset,
  dimensionsAndMeasures,
  results: emptyResults,
};

/** Folds every `setState` updater the component queued into the state they would produce. */
const appliedState = (setState: ReturnType<typeof vi.fn>): Partial<TableScrollableProState> =>
  setState.mock.calls.reduce<Partial<TableScrollableProState>>(
    (state, [update]) => ({ ...state, ...(typeof update === 'function' ? update(state) : update) }),
    { page: 0 },
  );

const rowsPassedToTable = async () => {
  const { getTableRows } = await import('../tables.utils');
  return vi.mocked(getTableRows).mock.calls.at(-1)?.[0].rows;
};

describe('TableScrollablePro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEmbeddableLayout).mockReturnValue({ heightMode: 'fixed' });
  });

  it('renders ChartCard', () => {
    render(<TableScrollablePro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard when provided', () => {
    render(<TableScrollablePro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders TableScrollable', () => {
    render(<TableScrollablePro {...defaultProps} />);
    expect(screen.getByTestId('table-scrollable')).toBeInTheDocument();
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
        <TableScrollablePro
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
        dimensionValue: 'A',
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
        <TableScrollablePro
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
        <TableScrollablePro
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

  describe('auto height', () => {
    const resultsOf = (rowCount: number, total?: number) =>
      ({
        data: Array.from({ length: rowCount }, (_, row) => ({ category: `row-${row}` })),
        isLoading: false,
        total,
      }) as unknown as DataResponse;

    beforeEach(() => {
      vi.mocked(useEmbeddableLayout).mockReturnValue({ heightMode: 'auto' });
    });

    it('parks the mode in embeddable state, which is the only way the query learns it', () => {
      const setState = vi.fn();
      render(<TableScrollablePro {...defaultProps} setState={setState} />);

      expect(appliedState(setState)).toMatchObject({ heightMode: 'auto' });
    });

    it('replaces the rows on a second response rather than appending them', async () => {
      const { rerender } = render(<TableScrollablePro {...defaultProps} results={resultsOf(2)} />);
      rerender(<TableScrollablePro {...defaultProps} results={resultsOf(3)} />);

      expect(await rowsPassedToTable()).toHaveLength(3);
    });

    it('still appends in fixed height, where each response is the next page', async () => {
      vi.mocked(useEmbeddableLayout).mockReturnValue({ heightMode: 'fixed' });

      const { rerender } = render(<TableScrollablePro {...defaultProps} results={resultsOf(2)} />);
      rerender(<TableScrollablePro {...defaultProps} results={resultsOf(3)} />);

      expect(await rowsPassedToTable()).toHaveLength(5);
    });

    it('turns off the scroll prefetch and refuses a next-page request', () => {
      const setState = vi.fn();
      render(<TableScrollablePro {...defaultProps} results={resultsOf(100)} setState={setState} />);

      expect(screen.getByTestId('table-scrollable')).toHaveAttribute('data-has-more-data', 'false');

      fireEvent.click(screen.getByTestId('next-page'));

      expect(appliedState(setState)).toMatchObject({ page: 0 });
    });

    it('says how much of the query is missing when the allowance cut it short', async () => {
      const { i18n } = await import('../../../../theme/i18n/i18n');
      render(<TableScrollablePro {...defaultProps} results={resultsOf(2, 5)} />);

      expect(screen.getByText('charts.tableScrollable.truncatedRows')).toBeInTheDocument();
      expect(i18n.t).toHaveBeenCalledWith('charts.tableScrollable.truncatedRows', {
        shown: '[2]',
        total: '[5]',
      });
    });

    it('says nothing when every row of the query is on screen', () => {
      render(<TableScrollablePro {...defaultProps} results={resultsOf(2, 2)} />);

      expect(screen.queryByText('charts.tableScrollable.truncatedRows')).not.toBeInTheDocument();
    });

    it('says nothing in fixed height, where a short page is the point', () => {
      vi.mocked(useEmbeddableLayout).mockReturnValue({ heightMode: 'fixed' });

      render(<TableScrollablePro {...defaultProps} results={resultsOf(2, 5)} />);

      expect(screen.queryByText('charts.tableScrollable.truncatedRows')).not.toBeInTheDocument();
    });

    it('starts the list again when the host switches a mounted table to fixed height', async () => {
      const results = resultsOf(3);
      const { rerender } = render(<TableScrollablePro {...defaultProps} results={results} />);

      vi.mocked(useEmbeddableLayout).mockReturnValue({ heightMode: 'fixed' });
      rerender(<TableScrollablePro {...defaultProps} results={results} />);

      expect(await rowsPassedToTable()).toHaveLength(3);

      // The page the new mode was already fetching replaces that list rather than extending it.
      rerender(<TableScrollablePro {...defaultProps} results={resultsOf(2)} />);

      expect(await rowsPassedToTable()).toHaveLength(2);
    });
  });
});
