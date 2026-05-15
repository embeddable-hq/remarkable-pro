import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import AreaChartPro from './index';
import type { AreaChartProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { getAreaChartProData, getAreaChartProOptions } from './AreaChartPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';

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

let capturedLineChartProps: Record<string, unknown> = {};
vi.mock('@embeddable.com/remarkable-ui', () => ({
  LineChart: (props: Record<string, unknown>) => {
    capturedLineChartProps = props;
    return <div data-testid="line-chart" />;
  },
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: ({ hasMarginTop }: { hasMarginTop?: boolean }) => (
    <div data-testid="granularity-select-field" data-has-margin-top={String(hasMarginTop)} />
  ),
}));

vi.mock('./AreaChartPro.utils', () => ({
  getAreaChartProData: vi.fn(() => ({ datasets: [], labels: [] })),
  getAreaChartProOptions: vi.fn(() => ({})),
}));

vi.mock('../../../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(() => undefined),
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

const makeElement = (index: number, datasetIndex: number, y: number) => ({
  index,
  datasetIndex,
  element: { y },
});

const makeEvent = (offsetY: number | null) => ({
  native: offsetY != null ? { offsetY } : null,
});

const getOnClick = () =>
  (capturedLineChartProps.options as { onClick: (...args: unknown[]) => void }).onClick;

describe('AreaChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedLineChartProps = {};
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
    vi.mocked(getAreaChartProData).mockReturnValue({ datasets: [], labels: [] } as never);
    vi.mocked(getAreaChartProOptions).mockReturnValue({} as never);
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

  describe('handleAreaClick', () => {
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [
        { rawLabel: 'Group A', data: [100, 200, 300] },
        { rawLabel: 'Group B', data: [50, 75, 90] },
      ],
    };

    beforeEach(() => {
      vi.mocked(getAreaChartProData).mockReturnValue(chartData as never);
    });

    it('does not call onAreaClicked when elements is empty', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(100), []);
      expect(onAreaClicked).not.toHaveBeenCalled();
    });

    it('does not call onAreaClicked when it is not provided', () => {
      render(<AreaChartPro {...defaultProps} />);
      expect(() => getOnClick()(makeEvent(100), [makeElement(0, 0, 50)])).not.toThrow();
    });

    it('selects the element with the highest y at or below clickY', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(70), [makeElement(0, 0, 30), makeElement(0, 1, 60)]);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('falls back to elements[0] when no element is at or below clickY', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(10), [makeElement(1, 0, 50), makeElement(1, 1, 70)]);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group A' }),
      );
    });

    it('uses all elements when clickY is null', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()({ native: null }, [makeElement(0, 0, 30), makeElement(0, 1, 80)]);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('passes dimensionValue from labels at element.index', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(100), [makeElement(1, 0, 50)]);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ dimensionValue: 'Feb' }),
      );
    });

    it('passes groupingDimensionValue from dataset.rawLabel at element.datasetIndex', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(100), [makeElement(0, 1, 50)]);
      expect(onAreaClicked).toHaveBeenCalledWith(
        expect.objectContaining({ groupingDimensionValue: 'Group B' }),
      );
    });

    it('calls getTimeRangeFromDimensionValue for both dimension and grouping dimension', () => {
      const onAreaClicked = vi.fn();
      render(<AreaChartPro {...defaultProps} onAreaClicked={onAreaClicked} />);
      getOnClick()(makeEvent(100), [makeElement(0, 0, 50)]);
      expect(getTimeRangeFromDimensionValue).toHaveBeenCalledTimes(2);
    });
  });
});
