import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useTheme } from '@embeddable.com/react';
import { KpiChart } from '@embeddable.com/remarkable-ui';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import {
  getComparisonPeriodDateRange,
  getComparisonPeriodLabel,
} from '../../../utils/timeRange.utils';
import { getKpiResults } from '../kpis.utils';
import { resolveI18nProps } from '../../../component.utils';
import type { DataResponse, Measure, TimeRange } from '@embeddable.com/core';
import type { Theme } from '../../../../theme/theme.types';
import KpiChartNumberComparisonPro from './index';

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ KpiChart: vi.fn(() => null) }));
vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: vi.fn(({ children }: { children: React.ReactNode }) => <>{children}</>),
}));
vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
  i18nSetup: vi.fn(),
}));
vi.mock('../../../component.utils', () => ({ resolveI18nProps: vi.fn() }));
vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(),
  getComparisonPeriodLabel: vi.fn(),
}));
vi.mock('../kpis.utils', () => ({ getKpiResults: vi.fn(), getKpiValueFormatter: vi.fn() }));

const measure = { name: 'revenue' } as unknown as Measure;
const primaryDateRange = { from: new Date('2024-01-01'), to: new Date('2024-01-31') } as TimeRange;
const comparisonDateRange = {
  from: new Date('2023-01-01'),
  to: new Date('2023-01-31'),
} as TimeRange;

const makeResults = (data?: Record<string, unknown>[], isLoading = false): DataResponse => ({
  isLoading,
  data,
});

const mockTheme = { disableFormatting: {} } as unknown as Theme;

const defaultProps = {
  measure,
  primaryDateRange,
  comparisonDateRange,
  results: makeResults([{ revenue: 1000 }]),
  resultsComparison: makeResults([{ revenue: 800 }]),
};

describe('KpiChartNumberComparisonPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue(mockTheme);
    vi.mocked(resolveI18nProps).mockImplementation((props) => props as never);
    vi.mocked(getComparisonPeriodLabel).mockReturnValue('Previous Period');
    vi.mocked(getKpiResults).mockImplementation((results) => results);
  });

  const renderComponent = (overrides: Record<string, unknown> = {}) => {
    render(<KpiChartNumberComparisonPro {...defaultProps} {...overrides} />);
    return {
      kpiChartProps: vi.mocked(KpiChart).mock.calls.at(-1)?.[0] as {
        comparisonValue: number;
        comparisonLabel: string;
      },
      chartCardProps: vi.mocked(ChartCard).mock.calls.at(-1)?.[0] as { data: DataResponse },
    };
  };

  describe('resultsCombined passed to ChartCard', () => {
    it('contains both primary and comparison rows when both have data', () => {
      const { chartCardProps } = renderComponent();
      expect(chartCardProps.data.data).toEqual([
        { label: 'charts.primaryPeriod', revenue: 1000 },
        { label: 'charts.comparisonPeriod', revenue: 800 },
      ]);
    });

    it('contains only the primary row when comparison data is empty', () => {
      const { chartCardProps } = renderComponent({ resultsComparison: makeResults([]) });
      expect(chartCardProps.data.data).toEqual([{ label: 'charts.primaryPeriod', revenue: 1000 }]);
    });

    it('contains only the comparison row when primary data is empty', () => {
      const { chartCardProps } = renderComponent({
        results: makeResults([]),
        resultsComparison: makeResults([{ revenue: 800 }]),
      });
      expect(chartCardProps.data.data).toEqual([
        { label: 'charts.comparisonPeriod', revenue: 800 },
      ]);
    });

    it('data is undefined when both results have undefined data', () => {
      const { chartCardProps } = renderComponent({
        results: makeResults(undefined),
        resultsComparison: makeResults(undefined),
      });
      expect(chartCardProps.data.data).toBeUndefined();
    });

    it('isLoading is true when primary results are loading', () => {
      const { chartCardProps } = renderComponent({ results: makeResults([], true) });
      expect(chartCardProps.data.isLoading).toBe(true);
    });

    it('isLoading is true when comparison results are loading', () => {
      const { chartCardProps } = renderComponent({
        resultsComparison: makeResults([{ revenue: 800 }], true),
      });
      expect(chartCardProps.data.isLoading).toBe(true);
    });

    it('isLoading is false when neither result is loading', () => {
      const { chartCardProps } = renderComponent();
      expect(chartCardProps.data.isLoading).toBe(false);
    });
  });

  describe('comparisonValue passed to KpiChart', () => {
    it('is the comparison measure value when comparisonDateRange is set', () => {
      const { kpiChartProps } = renderComponent();
      expect(kpiChartProps.comparisonValue).toBe(800);
    });

    it('is undefined when comparisonDateRange is not provided', () => {
      const { kpiChartProps } = renderComponent({ comparisonDateRange: undefined });
      expect(kpiChartProps.comparisonValue).toBeUndefined();
    });

    it('is undefined while primary results are loading', () => {
      const { kpiChartProps } = renderComponent({ results: makeResults([], true) });
      expect(kpiChartProps.comparisonValue).toBeUndefined();
    });

    it('is undefined while comparison results are loading', () => {
      const { kpiChartProps } = renderComponent({
        resultsComparison: makeResults([{ revenue: 800 }], true),
      });
      expect(kpiChartProps.comparisonValue).toBeUndefined();
    });
  });

  describe('comparisonLabel', () => {
    it('prefixes the lowercased comparison period label with "vs "', () => {
      vi.mocked(getComparisonPeriodLabel).mockReturnValue('Previous Period');
      const { kpiChartProps } = renderComponent({ comparisonPeriod: 'last_period' });
      expect(kpiChartProps.comparisonLabel).toBe('vs previous period');
    });
  });

  describe('setComparisonDateRange effect', () => {
    it('calls setComparisonDateRange with the computed date range on mount', () => {
      const newRange = { from: new Date('2023-01-01'), to: new Date('2023-01-31') } as TimeRange;
      vi.mocked(getComparisonPeriodDateRange).mockReturnValue(newRange);
      const setComparisonDateRange = vi.fn();

      renderComponent({ setComparisonDateRange, comparisonPeriod: 'last_period' });

      expect(getComparisonPeriodDateRange).toHaveBeenCalledWith(
        primaryDateRange,
        'last_period',
        mockTheme,
      );
      expect(setComparisonDateRange).toHaveBeenCalledWith(newRange);
    });

    it('skips the effect when setComparisonDateRange is not provided', () => {
      renderComponent({ setComparisonDateRange: undefined });
      expect(getComparisonPeriodDateRange).not.toHaveBeenCalled();
    });
  });
});
