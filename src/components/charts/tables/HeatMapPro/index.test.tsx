import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import HeatMapPro from './index';
import type { HeatMapProProps } from './index';
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
  HeatMap: () => <div data-testid="heat-map" />,
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

  it('passes exportOptions to ChartCard when provided', () => {
    render(<HeatMapPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders HeatMap', () => {
    render(<HeatMapPro {...defaultProps} />);
    expect(screen.getByTestId('heat-map')).toBeInTheDocument();
  });
});
