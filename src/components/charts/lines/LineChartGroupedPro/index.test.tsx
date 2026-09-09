import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import LineChartGroupedPro from './index';
import type { LineChartGroupedProProp } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { mergeGroupOtherResults } from '../../charts.utils';

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
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('./LineChartGroupedPro.utils', () => ({
  getLineChartGroupedProData: vi.fn(() => ({ datasets: [] })),
  getLineChartGroupedProOptions: vi.fn(() => ({})),
}));

vi.mock('../../charts.utils', () => ({
  createGroupedClickHandler: vi.fn(() => vi.fn()),
  mergeGroupOtherResults: vi.fn((mainResults) => mainResults),
}));

vi.mock('../../charts.hooks', () => ({
  useUpdateGroupOrderAndCacheKey: vi.fn(),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => <div data-testid="granularity-select" />,
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const xAxis = { name: 'date', inputs: {} } as unknown as Dimension;
const groupBy = { name: 'group', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;

const defaultProps: LineChartGroupedProProp = {
  xAxis,
  groupBy,
  measure,
  results: emptyResults,
};

describe('LineChartGroupedPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
    vi.mocked(mergeGroupOtherResults).mockImplementation((mainResults) => mainResults);
  });

  it('renders ChartCard', () => {
    render(<LineChartGroupedPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard when provided', () => {
    render(<LineChartGroupedPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('renders LineChart', () => {
    render(<LineChartGroupedPro {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('merges results with the Other query via mergeGroupOtherResults before filling gaps', () => {
    const mainResults = {
      data: [{ date: '2026-01-01', group: 'Widget', revenue: 10 }],
      isLoading: false,
    } as unknown as DataResponse;
    const resultsGroupOther = {
      data: [{ date: '2026-01-01', revenue: 30 }],
      isLoading: false,
    } as unknown as DataResponse;
    const mergedResults = {
      data: [
        { date: '2026-01-01', group: 'Widget', revenue: 10 },
        { date: '2026-01-01', group: 't(common.other)', revenue: 30 },
      ],
      isLoading: false,
    } as unknown as DataResponse;
    vi.mocked(mergeGroupOtherResults).mockReturnValue(mergedResults);

    render(
      <LineChartGroupedPro
        {...defaultProps}
        results={mainResults}
        resultsGroupOther={resultsGroupOther}
      />,
    );

    expect(mergeGroupOtherResults).toHaveBeenCalledWith(mainResults, resultsGroupOther, groupBy);
    const fillGapsArg = vi.mocked(useFillGaps).mock.calls[0]?.[0];
    expect(fillGapsArg?.results).toBe(mergedResults);
  });
});
