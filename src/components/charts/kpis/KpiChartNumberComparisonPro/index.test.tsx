import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Measure, TimeRange } from '@embeddable.com/core';
import KpiChartNumberComparisonPro, { KpiChartNumberComparisonProProp } from './index';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getComparisonPeriodLabel } from '../../../utils/timeRange.utils';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: vi.fn((props) => props),
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-card">{children}</div>
  ),
}));

const mockKpiChart = vi.fn();
vi.mock('@embeddable.com/remarkable-ui', () => ({
  KpiChart: (props: Record<string, unknown>) => {
    mockKpiChart(props);
    return <div data-testid="kpi-chart" />;
  },
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(),
}));

vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(() => ({
    relativeTimeString: 'Previous period',
    from: undefined,
    to: undefined,
  })),
  getComparisonPeriodLabel: vi.fn(() => 'previous period'),
}));

const makeMeasure = (name: string): Measure => ({ name }) as unknown as Measure;
const makeDateRange = (label: string): TimeRange =>
  ({ relativeTimeString: label, from: undefined, to: undefined }) as unknown as TimeRange;

const primaryDateRange = makeDateRange('This week');
const comparisonDateRange = makeDateRange('Previous period');

const defaultProps: KpiChartNumberComparisonProProp = {
  measure: makeMeasure('revenue'),
  primaryDateRange,
  comparisonDateRange,
  results: { data: [{ revenue: 100 }], isLoading: false } as unknown as DataResponse,
  resultsComparison: { data: [{ revenue: 80 }], isLoading: false } as unknown as DataResponse,
};

describe('KpiChartNumberComparisonPro', () => {
  let mockFormatter: {
    dimensionOrMeasureTitle: ReturnType<typeof vi.fn>;
    data: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatter = {
      dimensionOrMeasureTitle: vi.fn((m: Measure) => m.name),
      data: vi.fn((_, v) => String(v)),
    };
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getComparisonPeriodLabel).mockReturnValue('previous period');
  });

  describe('comparisonValue passed to KpiChart', () => {
    it('passes comparisonValue when both current and comparison data are present', () => {
      render(<KpiChartNumberComparisonPro {...defaultProps} />);
      expect(mockKpiChart).toHaveBeenCalledWith(
        expect.objectContaining({ value: 100, comparisonValue: 80 }),
      );
    });

    it('passes undefined comparisonValue when current value is undefined (no current data)', () => {
      const noCurrentData: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
      render(
        <KpiChartNumberComparisonPro
          {...defaultProps}
          results={noCurrentData}
          resultsComparison={
            { data: [{ revenue: 0 }], isLoading: false } as unknown as DataResponse
          }
        />,
      );
      expect(mockKpiChart).toHaveBeenCalledWith(
        expect.objectContaining({ value: undefined, comparisonValue: undefined }),
      );
    });

    it('passes undefined comparisonValue when current value is null', () => {
      const nullCurrentData: DataResponse = {
        data: [{ revenue: null }],
        isLoading: false,
      } as unknown as DataResponse;
      render(
        <KpiChartNumberComparisonPro
          {...defaultProps}
          results={nullCurrentData}
          resultsComparison={
            { data: [{ revenue: 50 }], isLoading: false } as unknown as DataResponse
          }
        />,
      );
      expect(mockKpiChart).toHaveBeenCalledWith(
        expect.objectContaining({ value: null, comparisonValue: undefined }),
      );
    });

    it('passes comparisonValue when current value is 0 (actual zero data)', () => {
      const zeroCurrentData: DataResponse = {
        data: [{ revenue: 0 }],
        isLoading: false,
      } as unknown as DataResponse;
      render(
        <KpiChartNumberComparisonPro
          {...defaultProps}
          results={zeroCurrentData}
          resultsComparison={
            { data: [{ revenue: 100 }], isLoading: false } as unknown as DataResponse
          }
        />,
      );
      expect(mockKpiChart).toHaveBeenCalledWith(
        expect.objectContaining({ value: 0, comparisonValue: 100 }),
      );
    });

    it('passes undefined comparisonValue when results are loading', () => {
      const loadingResults: DataResponse = {
        data: [{ revenue: 100 }],
        isLoading: true,
      } as unknown as DataResponse;
      render(
        <KpiChartNumberComparisonPro
          {...defaultProps}
          results={loadingResults}
          resultsComparison={
            { data: [{ revenue: 80 }], isLoading: false } as unknown as DataResponse
          }
        />,
      );
      expect(mockKpiChart).toHaveBeenCalledWith(
        expect.objectContaining({ comparisonValue: undefined }),
      );
    });
  });
});
