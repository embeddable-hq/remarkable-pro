import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import HeatMapPro from './index';
import type { HeatMapProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { useGetTableSortedResults } from '../tables.hooks';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HeatMap: ({ onCellClick }: Record<string, any>) => (
    <div data-testid="heat-map">
      <button
        data-testid="cell-click"
        onClick={() => onCellClick?.({ rowDimensionValue: 'R1', columnDimensionValue: 'C1' })}
      >
        cell
      </button>
    </div>
  ),
  getStyle: vi.fn(() => '#FF5400'),
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    dimensionOrMeasureTitle: vi.fn(() => ''),
    data: vi.fn(() => ''),
  })),
}));

vi.mock('../tables.hooks', () => ({
  useGetTableSortedResults: vi.fn((args: { results: DataResponse }) => args.results),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const rowDimension = { name: 'row', inputs: {} } as unknown as Dimension;
const columnDimension = { name: 'col', inputs: {} } as unknown as Dimension;
const measure = { name: 'value', inputs: {} } as unknown as Measure;

const defaultProps: HeatMapProProps = {
  rowDimension,
  columnDimension,
  measure,
  results: emptyResults,
};

describe('HeatMapPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard', () => {
    render(<HeatMapPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard when provided', () => {
    render(<HeatMapPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders HeatMap', () => {
    render(<HeatMapPro {...defaultProps} />);
    expect(screen.getByTestId('heat-map')).toBeInTheDocument();
  });

  describe('cell clicks', () => {
    const dataResults = {
      data: [{ row: 'R1', col: 'C1', value: 42 }],
      isLoading: false,
    } as unknown as DataResponse;

    beforeEach(() => {
      // The real hook returns the sorted rows array, which handleCellClick reads via .find()
      vi.mocked(useGetTableSortedResults).mockReturnValue([
        { row: 'R1', col: 'C1', value: 42 },
      ] as never);
    });

    it('dispatches a user interaction event and calls onCellClicked with the cell values', () => {
      vi.mocked(useFillGaps).mockReturnValue(dataResults);
      const onCellClicked = vi.fn();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      render(<HeatMapPro {...defaultProps} onCellClicked={onCellClicked} />);
      fireEvent.click(screen.getByTestId('cell-click'));

      expect(onCellClicked).toHaveBeenCalledWith(
        expect.objectContaining({ rowDimensionValue: 'R1', columnDimensionValue: 'C1' }),
      );
      const event = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
      expect(event.type).toBe('embeddable-user-interaction');
      expect(event.detail).toMatchObject({
        rowDimensionValue: 'R1',
        columnDimensionValue: 'C1',
        measureValue: 42,
      });
    });

    it('nulls out cell values when the dimensions resolve to time ranges', () => {
      const timeRowDimension = {
        name: 'row',
        nativeType: 'time',
        inputs: {},
      } as unknown as Dimension;
      const timeColumnDimension = {
        name: 'col',
        nativeType: 'time',
        inputs: {},
      } as unknown as Dimension;
      vi.mocked(useFillGaps).mockReturnValue(dataResults);
      const onCellClicked = vi.fn();

      render(
        <HeatMapPro
          {...defaultProps}
          rowDimension={timeRowDimension}
          columnDimension={timeColumnDimension}
          onCellClicked={onCellClicked}
        />,
      );
      fireEvent.click(screen.getByTestId('cell-click'));

      const arg = onCellClicked.mock.calls[0][0];
      expect(arg.rowDimensionValue).toBeUndefined();
      expect(arg.columnDimensionValue).toBeUndefined();
      expect(arg.rowDimensionTimeRange).toBeDefined();
      expect(arg.columnDimensionTimeRange).toBeDefined();
    });

    it('dispatches even when onCellClicked is not provided', () => {
      vi.mocked(useFillGaps).mockReturnValue(dataResults);
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      render(<HeatMapPro {...defaultProps} />);
      expect(() => fireEvent.click(screen.getByTestId('cell-click'))).not.toThrow();
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});
