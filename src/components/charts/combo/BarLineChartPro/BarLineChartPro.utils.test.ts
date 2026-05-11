import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  getBarLineChartProData,
  getBarLineChartProOptions,
  createBarLineClickHandler,
} from './BarLineChartPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation, groupTailAsOther } from '../../charts.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { getBarChartProOptions } from '../../bars/bars.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../charts.utils', () => ({
  groupTailAsOther: vi.fn(),
  getDimensionWithoutTruncation: vi.fn((d) => d),
}));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => []),
  getStyleNumber: vi.fn(() => 4),
}));
vi.mock('../../../../utils/color.utils', () => ({
  isColorValid: vi.fn(() => false),
  setColorAlpha: vi.fn((color: string) => `${color}-alpha`),
}));
vi.mock('../../bars/bars.utils', () => ({ getBarChartProOptions: vi.fn(() => ({})) }));
vi.mock('../../../utils/dimension.utils', () => ({ getTimeRangeFromDimensionValue: vi.fn() }));
vi.mock('mergician', () => ({
  mergician: vi.fn((...args: object[]) => {
    const deepMerge = (
      target: Record<string, unknown>,
      ...sources: Record<string, unknown>[]
    ): Record<string, unknown> => {
      for (const source of sources) {
        for (const key of Object.keys(source)) {
          const val = source[key];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            target[key] = deepMerge(
              (target[key] as Record<string, unknown>) ?? {},
              val as Record<string, unknown>,
            );
          } else {
            target[key] = val;
          }
        }
      }
      return target;
    };
    return deepMerge({}, ...(args as Record<string, unknown>[]));
  }),
}));

// -- helpers -----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'date',
    title: 'Date',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as Dimension;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (overrides: Record<string, any> = {}): Measure =>
  ({
    name: 'revenue',
    title: 'Revenue',
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const makeTheme = (overrides = {}) => ({ charts: {}, ...overrides }) as never;

const makeMockFormatter = () => ({
  data: vi.fn((_: unknown, value: unknown) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: { title: string }) => m.title),
});

// ----------------------------------------------------------------------------

describe('getBarLineChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
    vi.mocked(groupTailAsOther).mockImplementation((data) => data ?? []);
  });

  it('returns empty datasets when data is undefined', () => {
    const result = getBarLineChartProData(
      {
        data: undefined as never,
        dimension: makeDimension(),
        measures: [makeMeasure()],
        lineMeasures: [],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([{ data: [] }]);
  });

  it('maps dimension values to labels', () => {
    const dimension = makeDimension({ name: 'date' });
    const data = [{ date: 'Jan' }, { date: 'Feb' }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      { data, dimension, measures: [makeMeasure()], lineMeasures: [], showSecondaryAxis: false },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Jan', 'Feb']);
  });

  it('creates one bar dataset per measure', () => {
    const data = [{ date: 'Jan', revenue: 100, cost: 40 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' }), makeMeasure({ name: 'cost' })],
        lineMeasures: [],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    const barDatasets = result.datasets.filter((ds) => !('type' in ds));
    expect(barDatasets).toHaveLength(2);
  });

  it('creates one line dataset per line measure with type "line"', () => {
    const data = [{ date: 'Jan', revenue: 100, avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        lineMeasures: [makeMeasure({ name: 'avg' })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    const lineDatasets = result.datasets.filter((ds) => (ds as { type?: string }).type === 'line');
    expect(lineDatasets).toHaveLength(1);
  });

  it('bar datasets have order 1, line datasets have order 0', () => {
    const data = [{ date: 'Jan', revenue: 100, avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        lineMeasures: [makeMeasure({ name: 'avg' })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { order?: number }).order).toBe(1);
    expect((result.datasets[1] as { order?: number }).order).toBe(0);
  });

  it('bar measure missing values default to 0', () => {
    const data = [{ date: 'Jan', revenue: 100 }, { date: 'Feb' }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        lineMeasures: [],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([100, 0]);
  });

  it('line measure missing values are null when connectGaps is false', () => {
    const data = [{ date: 'Jan', avg: 45 }, { date: 'Feb' }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { connectGaps: false } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([45, null]);
  });

  it('line measure missing values are 0 when connectGaps is true', () => {
    const data = [{ date: 'Jan', avg: 45 }, { date: 'Feb' }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { connectGaps: true } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect(result.datasets[0]?.data).toEqual([45, 0]);
  });

  it('sets borderDash on line dataset when dashedLine is true', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { dashedLine: true } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { borderDash?: unknown }).borderDash).toBeDefined();
  });

  it('borderDash is undefined when dashedLine is false', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { dashedLine: false } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { borderDash?: unknown }).borderDash).toBeUndefined();
  });

  it('sets fill on line dataset when fillUnderLine is true', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { fillUnderLine: true } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { fill?: unknown }).fill).toBe(true);
  });

  it('assigns yAxisID "y1" to line measure when showSecondaryAxis and useSecondaryAxis are both true', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { useSecondaryAxis: true } })],
        showSecondaryAxis: true,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { yAxisID?: string }).yAxisID).toBe('y1');
  });

  it('assigns yAxisID "y" when showSecondaryAxis is false even if useSecondaryAxis is true', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { useSecondaryAxis: true } })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { yAxisID?: string }).yAxisID).toBe('y');
  });

  it('assigns yAxisID "y" when useSecondaryAxis is false', () => {
    const data = [{ date: 'Jan', avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [],
        lineMeasures: [makeMeasure({ name: 'avg', inputs: { useSecondaryAxis: false } })],
        showSecondaryAxis: true,
      },
      makeTheme(),
    );

    expect((result.datasets[0] as { yAxisID?: string }).yAxisID).toBe('y');
  });

  it('offsets color index for line measures by the number of bar measures', () => {
    const data = [{ date: 'Jan', revenue: 100, avg: 45 }];
    vi.mocked(groupTailAsOther).mockReturnValue(data);

    getBarLineChartProData(
      {
        data,
        dimension: makeDimension(),
        measures: [makeMeasure({ name: 'revenue' })],
        lineMeasures: [makeMeasure({ name: 'avg' })],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    const calls = vi.mocked(getDimensionMeasureColor).mock.calls;
    const lineColorCall = calls.find((call) => call[0].value === 'avg');
    expect(lineColorCall?.[0].index).toBe(1);
  });

  it('calls groupTailAsOther with all measures (bar + line)', () => {
    const dimension = makeDimension();
    const barMeasure = makeMeasure({ name: 'revenue' });
    const lineMeasure = makeMeasure({ name: 'avg' });
    const data = [{ date: 'Jan', revenue: 100, avg: 45 }];

    getBarLineChartProData(
      {
        data,
        dimension,
        measures: [barMeasure],
        lineMeasures: [lineMeasure],
        showSecondaryAxis: false,
      },
      makeTheme(),
    );

    expect(vi.mocked(groupTailAsOther)).toHaveBeenCalledWith(
      data,
      dimension,
      [barMeasure, lineMeasure],
      undefined,
    );
  });
});

// ----------------------------------------------------------------------------

describe('getBarLineChartProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getDimensionWithoutTruncation).mockImplementation((d) => d);
    vi.mocked(getBarChartProOptions).mockReturnValue({});
  });

  const makeChartData = (labels: string[] = [], datasets: { data: number[] }[] = []) => ({
    labels,
    datasets,
  });

  // -- interaction -------------------------------------------------------------

  describe('interaction', () => {
    it('sets interaction mode to "index"', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      expect(options.interaction?.mode).toBe('index');
    });

    it('sets intersect to false', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      expect(options.interaction?.intersect).toBe(false);
    });
  });

  // -- datalabels.display ------------------------------------------------------

  describe('datalabels.display', () => {
    it('returns false for bar series when showValueLabels is false', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
          showValueLabels: false,
        },
        makeTheme(),
      );

      const display = options.plugins?.datalabels?.display as (ctx: {
        datasetIndex: number;
        dataset: { data: unknown[] };
        dataIndex: number;
      }) => boolean | 'auto';
      const context = { datasetIndex: 0, dataset: { data: [100] }, dataIndex: 0 };
      expect(display(context)).toBe(false);
    });

    it('returns "auto" for bar series when showValueLabels is true and value is non-zero', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
          showValueLabels: true,
        },
        makeTheme(),
      );

      const display = options.plugins?.datalabels?.display as (ctx: {
        datasetIndex: number;
        dataset: { data: unknown[] };
        dataIndex: number;
      }) => boolean | 'auto';
      const context = { datasetIndex: 0, dataset: { data: [100] }, dataIndex: 0 };
      expect(display(context)).toBe('auto');
    });

    it('returns false for line series when showValueLabelsLine is false', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure({ name: 'revenue' })],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
          showValueLabelsLine: false,
        },
        makeTheme(),
      );

      const display = options.plugins?.datalabels?.display as (ctx: {
        datasetIndex: number;
        dataset: { data: unknown[] };
        dataIndex: number;
      }) => boolean | 'auto';
      // datasetIndex 1 >= measures.length 1 → line series
      const context = { datasetIndex: 1, dataset: { data: [45] }, dataIndex: 0 };
      expect(display(context)).toBe(false);
    });

    it('returns "auto" for line series when showValueLabelsLine is true and value is non-zero', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure({ name: 'revenue' })],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
          showValueLabelsLine: true,
        },
        makeTheme(),
      );

      const display = options.plugins?.datalabels?.display as (ctx: {
        datasetIndex: number;
        dataset: { data: unknown[] };
        dataIndex: number;
      }) => boolean | 'auto';
      const context = { datasetIndex: 1, dataset: { data: [45] }, dataIndex: 0 };
      expect(display(context)).toBe('auto');
    });

    it('returns false for zero values regardless of showValueLabels', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
          showValueLabels: true,
        },
        makeTheme(),
      );

      const display = options.plugins?.datalabels?.display as (ctx: {
        datasetIndex: number;
        dataset: { data: unknown[] };
        dataIndex: number;
      }) => boolean | 'auto';
      const context = { datasetIndex: 0, dataset: { data: [0] }, dataIndex: 0 };
      expect(display(context)).toBe(false);
    });
  });

  // -- tooltip -----------------------------------------------------------------

  describe('tooltip callbacks', () => {
    it('title callback formats the dimension label via getDimensionWithoutTruncation', () => {
      const dimension = makeDimension({ name: 'date' });
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension,
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      options.plugins?.tooltip?.callbacks?.title?.call({} as never, [{ label: 'Jan' }] as never);

      expect(getDimensionWithoutTruncation).toHaveBeenCalledWith(dimension);
      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'Jan');
    });

    it('label callback uses bar measure for datasetIndex within measures.length', () => {
      const barMeasure = makeMeasure({ name: 'revenue' });
      const options = getBarLineChartProOptions(
        {
          measures: [barMeasure],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      options.plugins?.tooltip?.callbacks?.label?.call(
        {} as never,
        { datasetIndex: 0, raw: 100, dataset: { label: 'Revenue' } } as never,
      );

      expect(mockFormatter.data).toHaveBeenCalledWith(barMeasure, 100);
    });

    it('label callback uses line measure for datasetIndex >= measures.length', () => {
      const barMeasure = makeMeasure({ name: 'revenue' });
      const lineMeasure = makeMeasure({ name: 'avg' });
      const options = getBarLineChartProOptions(
        {
          measures: [barMeasure],
          lineMeasures: [lineMeasure],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      options.plugins?.tooltip?.callbacks?.label?.call(
        {} as never,
        { datasetIndex: 1, raw: 45, dataset: { label: 'Average' } } as never,
      );

      expect(mockFormatter.data).toHaveBeenCalledWith(lineMeasure, 45);
    });

    it('label callback returns "datasetLabel: formattedValue"', () => {
      mockFormatter.data.mockReturnValue('fmt:100');

      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      const result = options.plugins?.tooltip?.callbacks?.label?.call(
        {} as never,
        { datasetIndex: 0, raw: 100, dataset: { label: 'Revenue' } } as never,
      );

      expect(result).toBe('Revenue: fmt:100');
    });
  });

  // -- secondary axis ----------------------------------------------------------

  describe('secondary axis (y1)', () => {
    it('does not add y1 scale when showSecondaryAxis is false', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: false,
        },
        makeTheme(),
      );

      expect(options.scales?.['y1']).toBeUndefined();
    });

    it('adds y1 scale when showSecondaryAxis is true', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [makeMeasure()],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: true,
        },
        makeTheme(),
      );

      expect(options.scales?.['y1']).toBeDefined();
    });

    it('y1 is positioned on the right', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: true,
        },
        makeTheme(),
      );

      expect(options.scales?.['y1']?.position).toBe('right');
    });

    it('y1 respects yAxisSecondaryMin and yAxisSecondaryMax', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [],
          lineMeasures: [makeMeasure({ name: 'avg' })],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: true,
          yAxisSecondaryMin: 10,
          yAxisSecondaryMax: 100,
        },
        makeTheme(),
      );

      expect(options.scales?.['y1']?.min).toBe(10);
      expect(options.scales?.['y1']?.max).toBe(100);
    });

    it('y1 tick callback formats using first line measure', () => {
      const lineMeasure = makeMeasure({ name: 'avg' });
      const options = getBarLineChartProOptions(
        {
          measures: [],
          lineMeasures: [lineMeasure],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: true,
        },
        makeTheme(),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options.scales?.['y1'] as any)?.ticks?.callback?.call({} as never, 50, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(lineMeasure, 50);
    });

    it('y1 title is displayed when yAxisSecondaryLabel is provided', () => {
      const options = getBarLineChartProOptions(
        {
          measures: [],
          lineMeasures: [makeMeasure()],
          dimension: makeDimension(),
          data: makeChartData() as never,
          showSecondaryAxis: true,
          yAxisSecondaryLabel: 'Avg',
        },
        makeTheme(),
      );

      expect(options.scales?.['y1']?.title?.display).toBe(true);
      expect(options.scales?.['y1']?.title?.text).toBe('Avg');
    });
  });

  // -- theme merge -------------------------------------------------------------

  it('merges theme-level barLineChartPro options', () => {
    const theme = {
      charts: { barLineChartPro: { options: { animation: false } } },
    } as never;

    vi.mocked(getBarChartProOptions).mockReturnValue({});

    const options = getBarLineChartProOptions(
      {
        measures: [makeMeasure()],
        lineMeasures: [],
        dimension: makeDimension(),
        data: makeChartData() as never,
        showSecondaryAxis: false,
      },
      theme,
    );

    expect((options as { animation?: unknown }).animation).toBe(false);
  });
});

// ----------------------------------------------------------------------------

describe('createBarLineClickHandler', () => {
  beforeEach(() => {
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(undefined);
  });

  it('calls onBarClicked when datasetIndex is within bar measures range', () => {
    const onBarClicked = vi.fn();
    const dimension = makeDimension();
    const measures = [makeMeasure({ name: 'revenue' })];
    const data = { labels: ['Jan', 'Feb'], datasets: [] };

    const handler = createBarLineClickHandler({
      data: data as never,
      dimension,
      measures,
      onBarClicked,
    });

    handler({ elementAtEvent: [{ index: 0, datasetIndex: 0 }] } as never);

    expect(onBarClicked).toHaveBeenCalledWith({
      dimensionValue: 'Jan',
      dimensionTimeRange: undefined,
    });
  });

  it('calls onLineClicked when datasetIndex is >= measures.length', () => {
    const onLineClicked = vi.fn();
    const dimension = makeDimension();
    const measures = [makeMeasure({ name: 'revenue' })];
    const data = { labels: ['Jan', 'Feb'], datasets: [] };

    const handler = createBarLineClickHandler({
      data: data as never,
      dimension,
      measures,
      onLineClicked,
    });

    handler({ elementAtEvent: [{ index: 1, datasetIndex: 1 }] } as never);

    expect(onLineClicked).toHaveBeenCalledWith({
      dimensionValue: 'Feb',
      dimensionTimeRange: undefined,
    });
  });

  it('does not call either handler when elementAtEvent is empty', () => {
    const onBarClicked = vi.fn();
    const onLineClicked = vi.fn();

    const handler = createBarLineClickHandler({
      data: { labels: ['Jan'], datasets: [] } as never,
      dimension: makeDimension(),
      measures: [makeMeasure()],
      onBarClicked,
      onLineClicked,
    });

    handler({ elementAtEvent: [] } as never);

    expect(onBarClicked).not.toHaveBeenCalled();
    expect(onLineClicked).not.toHaveBeenCalled();
  });

  it('does not call onLineClicked when a bar is clicked', () => {
    const onLineClicked = vi.fn();
    const measures = [makeMeasure()];

    const handler = createBarLineClickHandler({
      data: { labels: ['Jan'], datasets: [] } as never,
      dimension: makeDimension(),
      measures,
      onLineClicked,
    });

    handler({ elementAtEvent: [{ index: 0, datasetIndex: 0 }] } as never);

    expect(onLineClicked).not.toHaveBeenCalled();
  });

  it('does not call onBarClicked when a line is clicked', () => {
    const onBarClicked = vi.fn();
    const measures = [makeMeasure()];

    const handler = createBarLineClickHandler({
      data: { labels: ['Jan'], datasets: [] } as never,
      dimension: makeDimension(),
      measures,
      onBarClicked,
    });

    handler({ elementAtEvent: [{ index: 0, datasetIndex: 1 }] } as never);

    expect(onBarClicked).not.toHaveBeenCalled();
  });

  it('passes dimensionValue and dimensionTimeRange from getTimeRangeFromDimensionValue', () => {
    const fakeTimeRange = { from: '2024-01-01', to: '2024-01-31' };
    vi.mocked(getTimeRangeFromDimensionValue).mockReturnValue(fakeTimeRange as never);

    const onBarClicked = vi.fn();
    const dimension = makeDimension();

    const handler = createBarLineClickHandler({
      data: { labels: ['Jan'], datasets: [] } as never,
      dimension,
      granularity: 'month' as never,
      measures: [makeMeasure()],
      onBarClicked,
    });

    handler({ elementAtEvent: [{ index: 0, datasetIndex: 0 }] } as never);

    expect(getTimeRangeFromDimensionValue).toHaveBeenCalledWith({
      value: 'Jan',
      stateGranularity: 'month',
      dimension,
    });
    expect(onBarClicked).toHaveBeenCalledWith({
      dimensionValue: 'Jan',
      dimensionTimeRange: fakeTimeRange,
    });
  });
});
