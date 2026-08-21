import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import BarChartDefaultPro from './index';
import type { BarChartDefaultProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { useUpdateOtherBucketState } from '../../charts.otherBucket.hooks';
import { getBarChartProData } from '../bars.utils';
import { ChartCard } from '../../shared/ChartCard/ChartCard';

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
  BarChart: () => <div data-testid="bar-chart" />,
}));

vi.mock('../bars.utils', () => ({
  getBarChartProData: vi.fn(() => ({})),
  getBarChartProOptions: vi.fn(() => ({})),
}));

vi.mock('../../charts.utils', () => ({
  createSimpleClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../../charts.otherBucket.hooks', () => ({
  useUpdateOtherBucketState: vi.fn(),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => <div data-testid="granularity-select" />,
}));

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const dimension = { name: 'date', inputs: {} } as unknown as Dimension;
const measure = { name: 'revenue', inputs: {} } as unknown as Measure;

const defaultProps: BarChartDefaultProProps = {
  dimension,
  measures: [measure],
  results: emptyResults,
};

describe('BarChartDefaultPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  it('renders ChartCard and BarChart', () => {
    render(<BarChartDefaultPro {...defaultProps} />);
    expect(screen.getByTestId('chart-card')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('passes menuOptions to ChartCard', () => {
    render(<BarChartDefaultPro {...defaultProps} menuOptions={['csv', 'png']} />);
    const card = screen.getByTestId('chart-card');
    expect(JSON.parse(card.getAttribute('data-menu-options') || '[]')).toEqual(['csv', 'png']);
  });

  it('passes no menuOptions to ChartCard when not provided', () => {
    render(<BarChartDefaultPro {...defaultProps} />);
    const card = screen.getByTestId('chart-card');
    // menuOptions is undefined (not set), so JSON.stringify renders 'undefined'
    expect(card.getAttribute('data-menu-options')).toBeNull();
  });

  it('renders granularity selector when setGranularity is provided', () => {
    render(<BarChartDefaultPro {...defaultProps} setGranularity={vi.fn()} />);
    expect(screen.getByTestId('granularity-select')).toBeInTheDocument();
  });

  it('wires up useUpdateOtherBucketState with the primary results and otherBucket props', () => {
    const setOtherBucketState = vi.fn();
    render(
      <BarChartDefaultPro
        {...defaultProps}
        xAxisMaxItems={5}
        maxResults={1000}
        otherBucketCacheKey="key-1"
        setOtherBucketState={setOtherBucketState}
      />,
    );

    expect(useUpdateOtherBucketState).toHaveBeenCalledWith(
      expect.objectContaining({
        results: emptyResults,
        dimension,
        maxItems: 5,
        maxResults: 1000,
        cacheKey: 'key-1',
        setOtherBucketState,
      }),
    );
  });

  it('passes otherBucketAggregate to getBarChartProData when active and resolved', () => {
    const otherBucketRow = { revenue: 999 };
    const resultsOtherBucket = {
      data: [otherBucketRow],
      isLoading: false,
    } as unknown as DataResponse;

    render(
      <BarChartDefaultPro
        {...defaultProps}
        otherBucketActive
        resultsOtherBucket={resultsOtherBucket}
      />,
    );

    expect(getBarChartProData).toHaveBeenCalledWith(
      expect.objectContaining({ otherBucketAggregate: otherBucketRow }),
      expect.anything(),
    );
  });

  it('does not pass a stale otherBucketAggregate while resultsOtherBucket is loading', () => {
    const resultsOtherBucket = {
      data: [{ revenue: 999 }],
      isLoading: true,
    } as unknown as DataResponse;

    render(
      <BarChartDefaultPro
        {...defaultProps}
        otherBucketActive
        resultsOtherBucket={resultsOtherBucket}
      />,
    );

    expect(getBarChartProData).toHaveBeenCalledWith(
      expect.objectContaining({ otherBucketAggregate: undefined }),
      expect.anything(),
    );
  });

  it('does not pass otherBucketAggregate when otherBucketActive is false', () => {
    const resultsOtherBucket = {
      data: [{ revenue: 999 }],
      isLoading: false,
    } as unknown as DataResponse;

    render(
      <BarChartDefaultPro
        {...defaultProps}
        otherBucketActive={false}
        resultsOtherBucket={resultsOtherBucket}
      />,
    );

    expect(getBarChartProData).toHaveBeenCalledWith(
      expect.objectContaining({ otherBucketAggregate: undefined }),
      expect.anything(),
    );
  });

  it('surfaces resultsOtherBucket errors via ChartCard errorMessage', () => {
    const resultsOtherBucket = {
      data: undefined,
      isLoading: false,
      error: 'other bucket failed',
    } as unknown as DataResponse;

    render(<BarChartDefaultPro {...defaultProps} resultsOtherBucket={resultsOtherBucket} />);

    expect(vi.mocked(ChartCard)).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: 'other bucket failed' }),
      undefined,
    );
  });
});
