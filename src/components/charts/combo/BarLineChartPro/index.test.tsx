import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import BarLineChartPro, { BarLineChartProProps } from './index';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import {
  createBarLineClickHandler,
  getBarLineChartProData,
  getBarLineChartProOptions,
} from './BarLineChartPro.utils';
import { getChartCardData } from '../../charts.other.loadData.utils';

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  LineController: {},
  LineElement: {},
  PointElement: {},
}));

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
  BarChart: (props: Record<string, unknown>) => (
    <div data-testid="bar-chart" data-show-value-labels={String(props.showValueLabels)} />
  ),
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: ({ hasMarginTop }: { hasMarginTop?: boolean }) => (
    <div data-testid="granularity-select-field" data-has-margin-top={String(hasMarginTop)} />
  ),
}));

vi.mock('./BarLineChartPro.utils', () => ({
  getBarLineChartProData: vi.fn(() => ({ datasets: [], labels: [] })),
  getBarLineChartProOptions: vi.fn(() => ({})),
  createBarLineClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../../charts.other.loadData.utils', () => ({
  getChartCardData: vi.fn(() => ({ data: [], isLoading: false })),
}));

const makeMeasure = (name: string, inputs: Record<string, unknown> = {}): Measure =>
  ({ name, inputs }) as unknown as Measure;
const makeDimension = (): Dimension => ({ name: 'date', inputs: {} }) as unknown as Dimension;

const emptyResults: DataResponse = { data: [], isLoading: false } as unknown as DataResponse;

const defaultProps: BarLineChartProProps = {
  measures: [makeMeasure('revenue')],
  dimension: makeDimension(),
  results: emptyResults,
};

describe('BarLineChartPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFillGaps).mockReturnValue(emptyResults);
  });

  describe('rendering', () => {
    it('renders ChartCard and BarChart', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(screen.getByTestId('chart-card')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('useFillGaps', () => {
    it('is called with results and dimension', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(useFillGaps).toHaveBeenCalledWith({
        results: defaultProps.results,
        dimension: defaultProps.dimension,
      });
    });
  });

  describe('getBarLineChartProData', () => {
    it('is called with barMeasures, lineMeasures, dimension, and showSecondaryAxis derived from measure inputs', () => {
      const lineMeasures = [makeMeasure('orders', { useSecondaryAxis: true })];
      render(<BarLineChartPro {...defaultProps} lineMeasures={lineMeasures} />);
      expect(vi.mocked(getBarLineChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({
          barMeasures: defaultProps.measures,
          lineMeasures,
          dimension: defaultProps.dimension,
          showSecondaryAxis: true,
        }),
        expect.anything(),
      );
    });

    it('defaults lineMeasures to [] when not provided', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(vi.mocked(getBarLineChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({ lineMeasures: [] }),
        expect.anything(),
      );
    });

    it('defaults showSecondaryAxis to false', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(vi.mocked(getBarLineChartProData)).toHaveBeenCalledWith(
        expect.objectContaining({ showSecondaryAxis: false }),
        expect.anything(),
      );
    });

    it('passes xAxisMaxItems to getChartCardData as maxItems', () => {
      render(<BarLineChartPro {...defaultProps} xAxisMaxItems={20} />);
      expect(vi.mocked(getChartCardData)).toHaveBeenCalledWith(
        expect.objectContaining({ maxItems: 20 }),
      );
    });
  });

  describe('getBarLineChartProOptions', () => {
    it('is called with secondary axis props', () => {
      const lineMeasures = [makeMeasure('orders', { useSecondaryAxis: true })];
      render(
        <BarLineChartPro
          {...defaultProps}
          lineMeasures={lineMeasures}
          yAxisSecondaryLabel="Units"
          yAxisSecondaryMin={0}
          yAxisSecondaryMax={100}
        />,
      );
      expect(vi.mocked(getBarLineChartProOptions)).toHaveBeenCalledWith(
        expect.objectContaining({
          showSecondaryAxis: true,
          yAxisSecondaryLabel: 'Units',
          yAxisSecondaryMin: 0,
          yAxisSecondaryMax: 100,
        }),
        expect.anything(),
      );
    });

    it('is called with showValueLabels and showValueLabelsLine', () => {
      render(<BarLineChartPro {...defaultProps} showValueLabels showValueLabelsLine />);
      expect(vi.mocked(getBarLineChartProOptions)).toHaveBeenCalledWith(
        expect.objectContaining({ showValueLabels: true, showValueLabelsLine: true }),
        expect.anything(),
      );
    });
  });

  describe('createBarLineClickHandler', () => {
    it('is called with barMeasures, onBarClicked, onLineClicked, dimension, and granularity', () => {
      const onBarClicked = vi.fn();
      const onLineClicked = vi.fn();
      render(
        <BarLineChartPro
          {...defaultProps}
          onBarClicked={onBarClicked}
          onLineClicked={onLineClicked}
        />,
      );
      expect(vi.mocked(createBarLineClickHandler)).toHaveBeenCalledWith(
        expect.objectContaining({
          barMeasures: defaultProps.measures,
          onBarClicked,
          onLineClicked,
          dimension: defaultProps.dimension,
        }),
      );
    });
  });

  describe('BarChart showValueLabels prop', () => {
    it('passes true when showValueLabels is true', () => {
      render(<BarLineChartPro {...defaultProps} showValueLabels />);
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-show-value-labels', 'true');
    });

    it('passes true when showValueLabelsLine is true', () => {
      render(<BarLineChartPro {...defaultProps} showValueLabelsLine />);
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-show-value-labels', 'true');
    });

    it('passes undefined when neither showValueLabels nor showValueLabelsLine is set', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(screen.getByTestId('bar-chart')).toHaveAttribute(
        'data-show-value-labels',
        'undefined',
      );
    });
  });

  describe('granularity selector', () => {
    it('renders ChartGranularitySelectField when setGranularity is provided', () => {
      render(<BarLineChartPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toBeInTheDocument();
    });

    it('does not render ChartGranularitySelectField when setGranularity is not provided', () => {
      render(<BarLineChartPro {...defaultProps} />);
      expect(screen.queryByTestId('granularity-select-field')).not.toBeInTheDocument();
    });

    it('passes hasMarginTop=true when title, description and tooltip are all absent', () => {
      render(<BarLineChartPro {...defaultProps} setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'true',
      );
    });

    it('passes hasMarginTop=false when title is present', () => {
      render(<BarLineChartPro {...defaultProps} title="My Chart" setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });

    it('passes hasMarginTop=false when description is present', () => {
      render(
        <BarLineChartPro {...defaultProps} description="Some desc" setGranularity={vi.fn()} />,
      );
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });

    it('passes hasMarginTop=false when tooltip is present', () => {
      render(<BarLineChartPro {...defaultProps} tooltip="Tip" setGranularity={vi.fn()} />);
      expect(screen.getByTestId('granularity-select-field')).toHaveAttribute(
        'data-has-margin-top',
        'false',
      );
    });
  });
});
