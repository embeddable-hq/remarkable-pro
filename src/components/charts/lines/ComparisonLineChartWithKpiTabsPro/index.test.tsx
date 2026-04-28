import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure, TimeRange } from '@embeddable.com/core';
import ComparisonLineChartWithKpiTabsPro, { ComparisonLineChartWithKpiTabsProProps } from './index';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { getLineChartProData } from '../LineChartDefaultPro/LineChartDefaultPro.utils';
import { getComparisonPeriodDateRange } from '../../../utils/timeRange.utils';

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
  ChartCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-card">{children}</div>
  ),
}));

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  ChartTabs: ({
    items,
    value,
    onChange,
  }: {
    items: { id: string; label: string; value: string; slot?: React.ReactNode }[];
    value: string;
    onChange: (id: string) => void;
  }) => (
    <div data-testid="chart-tabs" data-value={value}>
      {items.map((item) => (
        <div key={item.id}>
          <button data-testid={`tab-${item.id}`} onClick={() => onChange(item.id)} />
          <span data-testid={`tab-label-${item.id}`}>{item.label}</span>
          <span data-testid={`tab-value-${item.id}`}>{item.value}</span>
          <div data-testid={`tab-slot-${item.id}`}>{item.slot}</div>
        </div>
      ))}
    </div>
  ),
  KpiTrend: ({ value, reverseTrend }: { value: string; reverseTrend?: boolean }) => (
    <div data-testid="kpi-trend" data-value={value} data-reverse-trend={String(reverseTrend)} />
  ),
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: ({ hasMarginTop }: { hasMarginTop?: boolean }) => (
    <div data-testid="granularity-select-field" data-has-margin-top={String(hasMarginTop)} />
  ),
}));

vi.mock('../LineChartDefaultPro/LineChartDefaultPro.utils', () => ({
  getLineChartProData: vi.fn(() => ({ datasets: [], labels: [] })),
  getLineChartProOptions: vi.fn(() => ({})),
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
}));

const makeMeasure = (name: string): Measure => ({ name }) as unknown as Measure;
const makeXAxis = (): Dimension => ({ name: 'date', inputs: {} }) as unknown as Dimension;
const makeDateRange = (label: string): TimeRange =>
  ({ relativeTimeString: label, from: undefined, to: undefined }) as unknown as TimeRange;

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const emptyKpis: DataResponse = { data: [] } as unknown as DataResponse;

const primaryDateRange = makeDateRange('This week');
const comparisonDateRange = makeDateRange('Previous period');

const defaultProps: ComparisonLineChartWithKpiTabsProProps = {
  measures: [makeMeasure('revenue')],
  xAxis: makeXAxis(),
  results: emptyResults,
  resultsKpis: emptyKpis,
  resultsKpisComparison: undefined,
  comparisonDateRange,
  primaryDateRange,
};

describe('ComparisonLineChartWithKpiTabsPro', () => {
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
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  describe('chartTabsItems', () => {
    it('uses measure name as tab id', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.getByTestId('tab-revenue')).toBeInTheDocument();
    });

    it('uses dimensionOrMeasureTitle for tab label', () => {
      mockFormatter.dimensionOrMeasureTitle.mockReturnValue('Revenue Label');
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.getByTestId('tab-label-revenue')).toHaveTextContent('Revenue Label');
    });

    it('shows "-" when the KPI value is null', () => {
      const resultsKpis = { data: [{ revenue: null }] } as unknown as DataResponse;
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      expect(screen.getByTestId('tab-value-revenue')).toHaveTextContent('-');
    });

    it('shows "-" when the KPI value is undefined', () => {
      const resultsKpis = { data: [{}] } as unknown as DataResponse;
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      expect(screen.getByTestId('tab-value-revenue')).toHaveTextContent('-');
    });

    it('shows "-" when resultsKpis has no data rows', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} resultsKpis={emptyKpis} />);
      expect(screen.getByTestId('tab-value-revenue')).toHaveTextContent('-');
    });

    it('shows "-" when resultsKpis is undefined', () => {
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={undefined as unknown as DataResponse}
        />,
      );
      expect(screen.getByTestId('tab-value-revenue')).toHaveTextContent('-');
    });

    it('formats KPI value using themeFormatter.data when present', () => {
      const resultsKpis = { data: [{ revenue: 42000 }] } as unknown as DataResponse;
      mockFormatter.data.mockReturnValue('$42,000');
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      expect(screen.getByTestId('tab-value-revenue')).toHaveTextContent('$42,000');
      expect(mockFormatter.data).toHaveBeenCalledWith(defaultProps.measures[0], 42000);
    });

    it('builds one tab per measure', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders'), makeMeasure('sessions')];
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      expect(screen.getByTestId('tab-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('tab-orders')).toBeInTheDocument();
      expect(screen.getByTestId('tab-sessions')).toBeInTheDocument();
    });
  });

  describe('active measure state', () => {
    it('defaults to the first measure', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'revenue');
    });

    it('updates activeMeasureName when a tab is clicked', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');
    });

    it('passes only the active measure to getLineChartProData after switching tabs', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(vi.mocked(getLineChartProData)).toHaveBeenLastCalledWith(
        expect.objectContaining({ measures: [expect.objectContaining({ name: 'orders' })] }),
        expect.anything(),
      );
    });

    it('resets to the first measure when the active one is removed', async () => {
      const { rerender } = render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders')]}
        />,
      );

      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');

      rerender(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('sales')]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'revenue');
      });
    });

    it('keeps the active measure when it still exists after a measures update', () => {
      const { rerender } = render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders')]}
        />,
      );

      fireEvent.click(screen.getByTestId('tab-orders'));

      rerender(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders'), makeMeasure('sales')]}
        />,
      );

      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');
    });
  });

  describe('useFillGaps', () => {
    it('is called with results, xAxis, and primaryDateRange as externalDateBounds', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} />);
      expect(useFillGaps).toHaveBeenCalledWith({
        results: defaultProps.results,
        dimension: defaultProps.xAxis,
        externalDateBounds: primaryDateRange,
      });
    });
  });

  describe('KpiTrend badge', () => {
    const resultsKpis = { data: [{ revenue: 100 }] } as unknown as DataResponse;
    const resultsKpisComparison = { data: [{ revenue: 80 }] } as unknown as DataResponse;

    it('renders KpiTrend when primaryDateRange, comparisonPeriod, and both KPI values are present', () => {
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={resultsKpis}
          resultsKpisComparison={resultsKpisComparison}
          comparisonPeriod="Previous period"
        />,
      );
      expect(screen.getByTestId('kpi-trend')).toBeInTheDocument();
    });

    it('does not render KpiTrend when comparisonPeriod is absent', () => {
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={resultsKpis}
          resultsKpisComparison={resultsKpisComparison}
          comparisonPeriod={undefined}
        />,
      );
      expect(screen.queryByTestId('kpi-trend')).not.toBeInTheDocument();
    });

    it('does not render KpiTrend when primaryDateRange is absent', () => {
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={resultsKpis}
          resultsKpisComparison={resultsKpisComparison}
          comparisonPeriod="Previous period"
          primaryDateRange={undefined as unknown as TimeRange}
        />,
      );
      expect(screen.queryByTestId('kpi-trend')).not.toBeInTheDocument();
    });

    it('does not render KpiTrend when kpiValue is null', () => {
      const kpisNull = { data: [{ revenue: null }] } as unknown as DataResponse;
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={kpisNull}
          resultsKpisComparison={resultsKpisComparison}
          comparisonPeriod="Previous period"
        />,
      );
      expect(screen.queryByTestId('kpi-trend')).not.toBeInTheDocument();
    });

    it('does not render KpiTrend when kpiComparisonValue is null', () => {
      const kpisCompNull = { data: [{ revenue: null }] } as unknown as DataResponse;
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={resultsKpis}
          resultsKpisComparison={kpisCompNull}
          comparisonPeriod="Previous period"
        />,
      );
      expect(screen.queryByTestId('kpi-trend')).not.toBeInTheDocument();
    });

    describe('trend text', () => {
      it('shows absolute positive diff with "+" prefix', () => {
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={resultsKpisComparison}
            comparisonPeriod="Previous period"
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '+20');
      });

      it('shows absolute negative diff without "+" prefix', () => {
        const kpisLower = { data: [{ revenue: 80 }] } as unknown as DataResponse;
        const kpisHigher = { data: [{ revenue: 100 }] } as unknown as DataResponse;
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={kpisLower}
            resultsKpisComparison={kpisHigher}
            comparisonPeriod="Previous period"
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '-20');
      });

      it('shows percentage with "+" prefix when displayChangeAsPercentage=true and positive', () => {
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={resultsKpisComparison}
            comparisonPeriod="Previous period"
            displayChangeAsPercentage={true}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '+25.0%');
      });

      it('shows percentage without "+" prefix when negative', () => {
        const kpisLower = { data: [{ revenue: 80 }] } as unknown as DataResponse;
        const kpisHigher = { data: [{ revenue: 100 }] } as unknown as DataResponse;
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={kpisLower}
            resultsKpisComparison={kpisHigher}
            comparisonPeriod="Previous period"
            displayChangeAsPercentage={true}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '-20.0%');
      });

      it('respects percentageDecimalPlaces when showing percentage', () => {
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={resultsKpisComparison}
            comparisonPeriod="Previous period"
            displayChangeAsPercentage={true}
            percentageDecimalPlaces={2}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '+25.00%');
      });

      it('falls back to absolute diff when kpiComparisonValue is 0 and displayChangeAsPercentage=true', () => {
        const kpisZeroComparison = { data: [{ revenue: 0 }] } as unknown as DataResponse;
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={kpisZeroComparison}
            comparisonPeriod="Previous period"
            displayChangeAsPercentage={true}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-value', '+100');
      });
    });

    describe('invertChangeColors', () => {
      it('sets reverseTrend=false for a positive diff when invertChangeColors is false', () => {
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={resultsKpisComparison}
            comparisonPeriod="Previous period"
            invertChangeColors={false}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-reverse-trend', 'false');
      });

      it('sets reverseTrend=true for a positive diff when invertChangeColors is true', () => {
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={resultsKpis}
            resultsKpisComparison={resultsKpisComparison}
            comparisonPeriod="Previous period"
            invertChangeColors={true}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-reverse-trend', 'true');
      });

      it('sets reverseTrend=true for a negative diff when invertChangeColors is false', () => {
        const kpisLower = { data: [{ revenue: 80 }] } as unknown as DataResponse;
        const kpisHigher = { data: [{ revenue: 100 }] } as unknown as DataResponse;
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={kpisLower}
            resultsKpisComparison={kpisHigher}
            comparisonPeriod="Previous period"
            invertChangeColors={false}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-reverse-trend', 'true');
      });

      it('sets reverseTrend=false for a negative diff when invertChangeColors is true', () => {
        const kpisLower = { data: [{ revenue: 80 }] } as unknown as DataResponse;
        const kpisHigher = { data: [{ revenue: 100 }] } as unknown as DataResponse;
        render(
          <ComparisonLineChartWithKpiTabsPro
            {...defaultProps}
            resultsKpis={kpisLower}
            resultsKpisComparison={kpisHigher}
            comparisonPeriod="Previous period"
            invertChangeColors={true}
          />,
        );
        expect(screen.getByTestId('kpi-trend')).toHaveAttribute('data-reverse-trend', 'false');
      });
    });
  });

  describe('setComparisonDateRange', () => {
    it('calls setComparisonDateRange on mount with the computed comparison date range', () => {
      const setComparisonDateRange = vi.fn();
      const fakeRange = makeDateRange('fake');
      vi.mocked(getComparisonPeriodDateRange).mockReturnValue(fakeRange);

      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          comparisonPeriod="Previous period"
          setComparisonDateRange={setComparisonDateRange}
        />,
      );

      expect(setComparisonDateRange).toHaveBeenCalledWith(fakeRange);
    });

    it('calls setComparisonDateRange again when comparisonPeriod changes', async () => {
      const setComparisonDateRange = vi.fn();
      const { rerender } = render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          comparisonPeriod="Previous period"
          setComparisonDateRange={setComparisonDateRange}
        />,
      );

      const callsBefore = setComparisonDateRange.mock.calls.length;

      rerender(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          comparisonPeriod="Previous year"
          setComparisonDateRange={setComparisonDateRange}
        />,
      );

      await waitFor(() => {
        expect(setComparisonDateRange.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });
  });

  describe('granularity selector', () => {
    it('renders ChartGranularitySelectField when setGranularity is provided', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toBeInTheDocument();
    });

    it('does not render ChartGranularitySelectField when setGranularity is not provided', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.queryByTestId('granularity-select-field')).not.toBeInTheDocument();
    });

    it('passes hasMarginTop=true when title, description and tooltip are all absent', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'true',
      );
    });

    it('passes hasMarginTop=false when title is present', () => {
      render(
        <ComparisonLineChartWithKpiTabsPro
          {...defaultProps}
          title="My Chart"
          setGranularity={vi.fn()}
        />,
      );
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });
  });

  describe('LineChart', () => {
    it('renders the line chart', () => {
      render(<ComparisonLineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
