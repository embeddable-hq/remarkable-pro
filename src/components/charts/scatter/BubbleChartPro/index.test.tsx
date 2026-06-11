import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import BubbleChartPro from './index';
import type { BubbleChartProProps } from './index';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({ charts: { bubbleChartPro: {} } })),
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

vi.mock('@embeddable.com/remarkable-ui', () => ({
  BubbleChart: () => <div data-testid="bubble-chart" />,
}));

vi.mock('./BubbleChartPro.utils', () => ({
  createBubbleClickHandler: vi.fn(() => vi.fn()),
  getBubbleChartProData: vi.fn(() => ({ datasets: [] })),
  getBubbleChartProOptions: vi.fn(() => ({})),
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const pointDimension = { name: 'point', inputs: {} } as unknown as Dimension;
const xMeasure = { name: 'x', inputs: {} } as unknown as Measure;
const yMeasure = { name: 'y', inputs: {} } as unknown as Measure;
const bubbleSizeMeasure = { name: 'size', inputs: {} } as unknown as Measure;

const defaultProps: BubbleChartProProps = {
  xMeasure,
  yMeasure,
  bubbleSizeMeasure,
  pointDimension,
  results: emptyResults,
};

describe('BubbleChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ChartCard', () => {
    render(<BubbleChartPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes exportOptions to ChartCard when provided', () => {
    render(<BubbleChartPro {...defaultProps} exportOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-export-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders BubbleChart', () => {
    render(<BubbleChartPro {...defaultProps} />);
    expect(screen.getByTestId('bubble-chart')).toBeInTheDocument();
  });
});
