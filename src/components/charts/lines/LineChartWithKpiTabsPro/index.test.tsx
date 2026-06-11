import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import LineChartWithKpiTabsPro, { LineChartWithKpiTabsProProps } from './index';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { getLineChartProData } from '../LineChartDefaultPro/LineChartDefaultPro.utils';

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
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
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
    items: { id: string; label: string; value: string }[];
    value: string;
    onChange: (id: string) => void;
  }) => (
    <div data-testid="chart-tabs" data-value={value} data-items={JSON.stringify(items)}>
      {items.map((item) => (
        <button key={item.id} data-testid={`tab-${item.id}`} onClick={() => onChange(item.id)} />
      ))}
    </div>
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

const makeMeasure = (name: string): Measure => ({ name }) as unknown as Measure;
const makeXAxis = (): Dimension => ({ name: 'date', inputs: {} }) as unknown as Dimension;

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;
const emptyKpis: DataResponse = { data: [] } as unknown as DataResponse;

const defaultProps: LineChartWithKpiTabsProProps = {
  measures: [makeMeasure('revenue')],
  xAxis: makeXAxis(),
  results: emptyResults,
  resultsKpis: emptyKpis,
};

describe('LineChartWithKpiTabsPro', () => {
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
      render(<LineChartWithKpiTabsPro {...defaultProps} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].id).toBe('revenue');
    });

    it('uses dimensionOrMeasureTitle for tab label', () => {
      mockFormatter.dimensionOrMeasureTitle.mockReturnValue('Revenue Label');
      render(<LineChartWithKpiTabsPro {...defaultProps} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].label).toBe('Revenue Label');
    });

    it('shows "-" when the KPI value is null', () => {
      const resultsKpis = { data: [{ revenue: null }] } as unknown as DataResponse;
      render(<LineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].value).toBe('-');
    });

    it('shows "-" when the KPI value is undefined', () => {
      const resultsKpis = { data: [{}] } as unknown as DataResponse;
      render(<LineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].value).toBe('-');
    });

    it('shows "-" when resultsKpis has no data rows', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} resultsKpis={emptyKpis} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].value).toBe('-');
    });

    it('shows "-" when resultsKpis is undefined', () => {
      render(
        <LineChartWithKpiTabsPro
          {...defaultProps}
          resultsKpis={undefined as unknown as DataResponse}
        />,
      );
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].value).toBe('-');
    });

    it('formats KPI value using themeFormatter.data when present', () => {
      const resultsKpis = { data: [{ revenue: 42000 }] } as unknown as DataResponse;
      mockFormatter.data.mockReturnValue('$42,000');
      render(<LineChartWithKpiTabsPro {...defaultProps} resultsKpis={resultsKpis} />);
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items[0].value).toBe('$42,000');
      expect(mockFormatter.data).toHaveBeenCalledWith(defaultProps.measures[0], 42000);
    });

    it('builds one tab per measure', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders'), makeMeasure('sessions')];
      const resultsKpis = {
        data: [{ revenue: 1, orders: 2, sessions: 3 }],
      } as unknown as DataResponse;
      render(
        <LineChartWithKpiTabsPro {...defaultProps} measures={measures} resultsKpis={resultsKpis} />,
      );
      const items = JSON.parse(screen.getByTestId('chart-tabs').getAttribute('data-items')!);
      expect(items).toHaveLength(3);
    });
  });

  describe('active measure state', () => {
    it('defaults to the first measure', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<LineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'revenue');
    });

    it('updates activeMeasureName when a tab is clicked', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<LineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');
    });

    it('passes only the active measure to getLineChartProData after switching tabs', () => {
      const measures = [makeMeasure('revenue'), makeMeasure('orders')];
      render(<LineChartWithKpiTabsPro {...defaultProps} measures={measures} />);
      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(vi.mocked(getLineChartProData)).toHaveBeenLastCalledWith(
        expect.objectContaining({ measures: [expect.objectContaining({ name: 'orders' })] }),
        expect.anything(),
      );
    });

    it('resets to the first measure when the active one is removed', async () => {
      const { rerender } = render(
        <LineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders')]}
        />,
      );

      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');

      rerender(
        <LineChartWithKpiTabsPro
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
        <LineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders')]}
        />,
      );

      fireEvent.click(screen.getByTestId('tab-orders'));
      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');

      rerender(
        <LineChartWithKpiTabsPro
          {...defaultProps}
          measures={[makeMeasure('revenue'), makeMeasure('orders'), makeMeasure('sales')]}
        />,
      );

      expect(screen.getByTestId('chart-tabs')).toHaveAttribute('data-value', 'orders');
    });
  });

  describe('useFillGaps', () => {
    it('is called with results and xAxis', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} />);
      expect(useFillGaps).toHaveBeenCalledWith({
        results: defaultProps.results,
        dimension: defaultProps.xAxis,
      });
    });
  });

  describe('granularity selector', () => {
    it('renders ChartGranularitySelectField when setGranularity is provided', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toBeInTheDocument();
    });

    it('does not render ChartGranularitySelectField when setGranularity is not provided', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.queryByTestId('granularity-select-field')).not.toBeInTheDocument();
    });

    it('passes hasMarginTop=true when title, description and tooltip are all absent', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'true',
      );
    });

    it('passes hasMarginTop=false when title is present', () => {
      render(
        <LineChartWithKpiTabsPro {...defaultProps} title="My Chart" setGranularity={vi.fn()} />,
      );
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });
  });

  describe('LineChart', () => {
    it('renders the line chart', () => {
      render(<LineChartWithKpiTabsPro {...defaultProps} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
