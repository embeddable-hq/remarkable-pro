import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import TableScrollablePro from './index';
import type { TableScrollableProProps } from './index';

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
  TableScrollable: vi.fn(({ ref: _ref, ...rest }: Record<string, unknown>) => (
    <div data-testid="table-scrollable" {...rest} />
  )),
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

describe('TableScrollablePro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
