import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import AreaChartPro from './index';
import type { AreaChartProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import {
  createAreaClickHandler,
  getAreaChartProData,
  getAreaChartProOptions,
} from './AreaChartPro.utils';

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
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: ({ hasMarginTop }: { hasMarginTop?: boolean }) => (
    <div data-testid="granularity-select-field" data-has-margin-top={String(hasMarginTop)} />
  ),
}));

vi.mock('./AreaChartPro.utils', () => ({
  getAreaChartProData: vi.fn(() => ({ datasets: [], labels: [] })),
  getAreaChartProOptions: vi.fn(() => ({})),
  createAreaClickHandler: vi.fn(() => vi.fn()),
}));

const makeMeasure = (name = 'revenue'): Measure => ({ name, inputs: {} }) as unknown as Measure;
const makeDimension = (name = 'date'): Dimension => ({ name, inputs: {} }) as unknown as Dimension;

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;

const defaultProps: AreaChartProProps = {
  xAxis: makeDimension(),
  groupBy: makeDimension('category'),
  measure: makeMeasure(),
  results: emptyResults,
};

describe('AreaChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
    vi.mocked(getAreaChartProData).mockReturnValue({ datasets: [], labels: [] } as never);
    vi.mocked(getAreaChartProOptions).mockReturnValue({} as never);
    vi.mocked(createAreaClickHandler).mockReturnValue(vi.fn());
  });

  describe('rendering', () => {
    it('renders ChartCard and LineChart', () => {
      render(<AreaChartPro {...defaultProps} />);
      expect(screen.getByTestId('chart-card')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('useFillGaps', () => {
    it('is called with results and xAxis', () => {
      render(<AreaChartPro {...defaultProps} />);
      expect(useFillGaps).toHaveBeenCalledWith({
        results: defaultProps.results,
        dimension: defaultProps.xAxis,
      });
    });
  });

  describe('getAreaChartProData', () => {
    it('is called with xAxis, groupBy, measure, and data from useFillGaps', () => {
      const filledResults = { ...emptyResults, data: [{ date: 'Jan' }] };
      vi.mocked(useFillGaps).mockReturnValue(filledResults as never);
      render(<AreaChartPro {...defaultProps} />);
      expect(vi.mocked(getAreaChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({
          dimension: defaultProps.xAxis,
          groupDimension: defaultProps.groupBy,
          measure: defaultProps.measure,
          data: filledResults.data,
        }),
        expect.anything(),
      );
    });

    it('passes hasMinMaxYAxisRange=true when yAxisRangeMin is provided', () => {
      render(<AreaChartPro {...defaultProps} yAxisRangeMin={0} />);
      expect(vi.mocked(getAreaChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({ hasMinMaxYAxisRange: true }),
        expect.anything(),
      );
    });

    it('passes hasMinMaxYAxisRange=true when yAxisRangeMax is provided', () => {
      render(<AreaChartPro {...defaultProps} yAxisRangeMax={100} />);
      expect(vi.mocked(getAreaChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({ hasMinMaxYAxisRange: true }),
        expect.anything(),
      );
    });

    it('passes hasMinMaxYAxisRange=false when neither range prop is provided', () => {
      render(<AreaChartPro {...defaultProps} />);
      expect(vi.mocked(getAreaChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({ hasMinMaxYAxisRange: false }),
        expect.anything(),
      );
    });
  });

  describe('getAreaChartProOptions', () => {
    it('is called with xAxis, groupBy, measure, and chart data', () => {
      const chartData = { datasets: [{ data: [1] }], labels: ['Jan'] };
      vi.mocked(getAreaChartProData).mockReturnValue(chartData as never);
      render(<AreaChartPro {...defaultProps} />);
      expect(vi.mocked(getAreaChartProOptions)).toHaveBeenCalledWith(
        expect.objectContaining({
          dimension: defaultProps.xAxis,
          groupDimension: defaultProps.groupBy,
          measure: defaultProps.measure,
          data: chartData,
        }),
        expect.anything(),
      );
    });
  });

  describe('createAreaClickHandler', () => {
    it('is called with dimension, groupBy, granularity, onPointClicked, and onAreaClicked', () => {
      const onPointClicked = vi.fn();
      const onAreaClicked = vi.fn();
      render(
        <AreaChartPro
          {...defaultProps}
          granularity="month"
          onPointClicked={onPointClicked}
          onAreaClicked={onAreaClicked}
        />,
      );
      expect(vi.mocked(createAreaClickHandler)).toHaveBeenCalledWith(
        expect.objectContaining({
          dimension: defaultProps.xAxis,
          groupBy: defaultProps.groupBy,
          granularity: 'month',
          onPointClicked,
          onAreaClicked,
        }),
      );
    });
  });

  describe('granularity selector', () => {
    it('renders ChartGranularitySelectField when setGranularity is provided', () => {
      render(<AreaChartPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toBeInTheDocument();
    });

    it('does not render ChartGranularitySelectField when setGranularity is not provided', () => {
      render(<AreaChartPro {...defaultProps} />);
      expect(screen.queryByTestId('granularity-select-field')).not.toBeInTheDocument();
    });

    it('passes hasMarginTop=true when title, description, and tooltip are all absent', () => {
      render(<AreaChartPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'true',
      );
    });

    it('passes hasMarginTop=false when title is present', () => {
      render(<AreaChartPro {...defaultProps} title="My Chart" setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });

    it('passes hasMarginTop=false when description is present', () => {
      render(<AreaChartPro {...defaultProps} description="Some desc" setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });

    it('passes hasMarginTop=false when tooltip is present', () => {
      render(<AreaChartPro {...defaultProps} tooltip="Tip" setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });
  });
});
