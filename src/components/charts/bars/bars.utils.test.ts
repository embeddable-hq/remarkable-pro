import type { Dimension, Measure } from '@embeddable.com/core';
import { getBarStackedChartProData, getBarChartProData, getBarChartProOptions } from './bars.utils';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { getDatalabelPercentage, groupTailAsOther } from '../charts.utils';
import { getDimensionMeasureColor } from '../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { Context } from 'chartjs-plugin-datalabels';

vi.mock('../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../charts.utils', () => ({ groupTailAsOther: vi.fn(), getDatalabelPercentage: vi.fn() }));
vi.mock('../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));
vi.mock('../../../theme/theme.constants', () => ({ remarkableTheme: { charts: {} } }));

// -- helpers -----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'category',
    title: 'Category',
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

const makeTheme = () => ({ charts: { legendPosition: 'bottom' } }) as never;

const makeMockFormatter = () => ({
  data: vi.fn((_, value) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: Measure) => m.title ?? m.name),
});

// ----------------------------------------------------------------------------

describe('getBarStackedChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
  });

  it('returns correct labels (axis) from the dimension column', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [
      { category: 'A', region: 'North', sales: '10' },
      { category: 'B', region: 'South', sales: '20' },
    ];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.labels).toEqual(['A', 'B']);
  });

  it('creates one dataset per unique group value', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [
      { category: 'A', region: 'North', sales: '10' },
      { category: 'A', region: 'South', sales: '5' },
      { category: 'B', region: 'North', sales: '20' },
    ];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(2);
  });

  it('fills missing group/axis combinations with 0', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [
      { category: 'A', region: 'North', sales: '10' },
      { category: 'B', region: 'South', sales: '20' },
    ];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    const northDataset = result.datasets.find(
      (ds) => (ds as { rawLabel?: string }).rawLabel === 'North',
    );
    expect(northDataset?.data).toEqual([10, 0]); // present for A, missing for B
  });

  it('filters null dimension values from axis', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [
      { category: 'A', region: 'North', sales: '10' },
      { category: null, region: 'North', sales: '5' },
    ];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.labels).toEqual(['A']);
  });

  it('appends granularity to the group dimension name for time dimensions', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({
      name: 'date',
      nativeType: 'time',
      inputs: { granularity: 'month' },
    });
    const measure = makeMeasure({ name: 'sales' });

    const data = [
      { category: 'A', 'date.month': 'Jan', sales: '100' },
      { category: 'B', 'date.month': 'Feb', sales: '200' },
    ];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(2);
    expect(result.labels).toEqual(['A', 'B']);
  });

  it('does not append granularity when groupDimension is a time type without inputs.granularity', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'date', nativeType: 'time', inputs: {} });
    const measure = makeMeasure({ name: 'sales' });

    const data = [{ category: 'A', date: 'Q1', sales: '50' }];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(1);
    expect((result.datasets[0] as { rawLabel?: string })?.rawLabel).toBe('Q1');
  });

  it('assigns background and border colors from getDimensionMeasureColor', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [{ category: 'A', region: 'North', sales: '10' }];

    const result = getBarStackedChartProData(
      { data, dimension, groupDimension, measure },
      makeTheme(),
    );

    expect(result.datasets[0]?.backgroundColor).toBe('#bg-0');
    expect(result.datasets[0]?.borderColor).toBe('#bd-0');
  });

  it('uses themeFormatter.data for dataset labels', () => {
    const dimension = makeDimension({ name: 'category' });
    const groupDimension = makeDimension({ name: 'region', nativeType: 'string' });
    const measure = makeMeasure({ name: 'sales' });

    const data = [{ category: 'A', region: 'North', sales: '10' }];

    getBarStackedChartProData({ data, dimension, groupDimension, measure }, makeTheme());

    expect(mockFormatter.data).toHaveBeenCalledWith(groupDimension, 'North');
  });
});

// ----------------------------------------------------------------------------

describe('getBarChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
    vi.mocked(groupTailAsOther).mockImplementation((data) => data ?? []);
  });

  it('returns empty datasets when data is undefined', () => {
    const result = getBarChartProData({
      data: undefined as never,
      dimension: makeDimension(),
      measures: [makeMeasure()],
    });

    expect(result.labels).toEqual([]);
    expect(result.datasets).toEqual([{ data: [] }]);
  });

  it('creates one dataset per measure', () => {
    const dimension = makeDimension({ name: 'product' });
    const measures = [makeMeasure({ name: 'revenue' }), makeMeasure({ name: 'cost' })];
    const data = [{ product: 'Widget', revenue: '100', cost: '40' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarChartProData({ data, dimension, measures }, makeTheme());

    expect(result.datasets).toHaveLength(2);
  });

  it('maps dimension values to labels', () => {
    const dimension = makeDimension({ name: 'product' });
    const data = [
      { product: 'Widget', revenue: '100' },
      { product: 'Gadget', revenue: '200' },
    ];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarChartProData(
      { data, dimension, measures: [makeMeasure({ name: 'revenue' })] },
      makeTheme(),
    );

    expect(result.labels).toEqual(['Widget', 'Gadget']);
  });

  it('maps measure values to dataset data, defaulting missing values to 0', () => {
    const dimension = makeDimension({ name: 'product' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ product: 'Widget', revenue: '100' }, { product: 'Gadget' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarChartProData({ data, dimension, measures: [measure] }, makeTheme());

    expect(result.datasets[0]?.data).toEqual(['100', 0]);
  });

  it('calls groupTailAsOther with maxItems when provided', () => {
    const dimension = makeDimension({ name: 'product' });
    const measures = [makeMeasure({ name: 'revenue' })];
    const data = [{ product: 'Widget', revenue: '100' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    getBarChartProData({ data, dimension, measures, maxItems: 5 }, makeTheme());

    expect(vi.mocked(groupTailAsOther)).toHaveBeenCalledWith(data, dimension, measures, 5);
  });

  it('assigns background and border colors per measure', () => {
    const dimension = makeDimension({ name: 'product' });
    const measure = makeMeasure({ name: 'revenue' });
    const data = [{ product: 'A', revenue: '10' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarChartProData({ data, dimension, measures: [measure] }, makeTheme());

    expect(result.datasets[0]?.backgroundColor).toBe('#bg-0');
    expect(result.datasets[0]?.borderColor).toBe('#bd-0');
  });

  it('uses dimensionOrMeasureTitle for dataset labels', () => {
    const dimension = makeDimension({ name: 'product' });
    const measure = makeMeasure({ name: 'revenue', title: 'Revenue' });
    const data = [{ product: 'A', revenue: '10' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    getBarChartProData({ data, dimension, measures: [measure] }, makeTheme());

    expect(mockFormatter.dimensionOrMeasureTitle).toHaveBeenCalledWith(measure);
  });

  it('uses the default remarkableTheme when no theme argument is supplied', () => {
    const dimension = makeDimension({ name: 'product' });
    const data = [{ product: 'Widget', revenue: '100' }];

    vi.mocked(groupTailAsOther).mockReturnValue(data);

    const result = getBarChartProData({ data, dimension, measures: [makeMeasure()] });

    expect(result.datasets).toHaveLength(1);
  });
});

// ----------------------------------------------------------------------------

describe('getBarChartProOptions', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  const measures = [makeMeasure({ name: 'revenue', title: 'Revenue' })];
  const dimension = makeDimension({ name: 'product' });

  const makeChartData = (labels: string[], datasetValues: number[][]) => ({
    labels,
    datasets: datasetValues.map((vals) => ({ data: vals })),
  });

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
  });

  // -- datalabels.labels.total ------------------------------------------------

  describe('datalabels total formatter', () => {
    it('sums all dataset values at the given dataIndex and formats with the first measure', () => {
      const data = makeChartData(
        ['A', 'B'],
        [
          [10, 20],
          [5, 15],
        ],
      );
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const context = { dataIndex: 0, chart: { data } } as unknown as Context;
      const formatter = options.plugins!.datalabels!.labels!.total!.formatter!;
      const result = formatter(0, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 15);
      expect(result).toBe('fmt:15');
    });

    it('treats non-numeric dataset values as 0 in the total', () => {
      const data = { labels: ['A'], datasets: [{ data: [null] }, { data: [10] }] };
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const context = { dataIndex: 0, chart: { data } } as unknown as Context;
      const formatter = options.plugins!.datalabels!.labels!.total!.formatter!;
      formatter(0, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 10);
    });
  });

  // -- datalabels.labels.value ------------------------------------------------

  describe('datalabels value formatter', () => {
    it('formats the value using the measure at the dataset index', () => {
      const measures2 = [makeMeasure({ name: 'revenue' }), makeMeasure({ name: 'cost' })];
      const data = makeChartData(['A'], [[100], [40]]);
      const options = getBarChartProOptions(
        { measures: measures2, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const context = { datasetIndex: 1 } as Context;
      const formatter = options.plugins!.datalabels!.labels!.value!.formatter!;
      formatter(40, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures2[1], 40);
    });

    it('wraps around measure index using modulo', () => {
      const data = makeChartData(['A'], [[10], [20], [30]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      // datasetIndex 2, measures.length 1 → index 0
      const context = { datasetIndex: 2 } as Context;
      options.plugins!.datalabels!.labels!.value!.formatter!(30, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 30);
    });

    it('returns getDatalabelPercentage result when showValueAsPercentage is true', () => {
      vi.mocked(getDatalabelPercentage).mockReturnValue('50%');

      const measureWithPct = makeMeasure({
        name: 'revenue',
        inputs: { showValueAsPercentage: true },
      });
      const data = makeChartData(['A'], [[50]]);
      const options = getBarChartProOptions(
        { measures: [measureWithPct], dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const context = { datasetIndex: 0, dataset: { data: [50] } } as never;
      const result = options.plugins!.datalabels!.labels!.value!.formatter!(50, context);

      expect(getDatalabelPercentage).toHaveBeenCalledWith(50, [50]);
      expect(result).toBe('50%');
    });
  });

  // -- tooltip ---------------------------------------------------------------

  describe('tooltip callbacks', () => {
    it('title callback formats the dimension label', () => {
      const data = makeChartData(['Widget'], [[100]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const context = [{ label: 'Widget' }] as never;
      options.plugins!.tooltip!.callbacks!.title!.call({} as never, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'Widget');
    });

    it('label callback formats the dataset label and measure value', () => {
      const data = makeChartData(['A'], [[50]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      mockFormatter.data.mockImplementation((_, value) => `fmt:${value}`);

      const context = {
        datasetIndex: 0,
        raw: 50,
        dataset: { label: 'Revenue' },
      } as never;
      options.plugins!.tooltip!.callbacks!.label!.call({} as never, context);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 50);
    });

    it('appends percentage to label when showValueAsPercentage is true', () => {
      vi.mocked(getDatalabelPercentage).mockReturnValue('50%');

      const measureWithPct = makeMeasure({
        name: 'revenue',
        inputs: { showValueAsPercentage: true },
      });
      const data = makeChartData(['A'], [[50]]);
      const options = getBarChartProOptions(
        { measures: [measureWithPct], dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      mockFormatter.data.mockImplementation((_, value) => `fmt:${value}`);

      const context = {
        datasetIndex: 0,
        raw: 50,
        dataset: { label: 'Revenue', data: [50] },
      } as never;
      const result = options.plugins!.tooltip!.callbacks!.label!.call({} as never, context);

      expect(getDatalabelPercentage).toHaveBeenCalledWith(50, [50]);
      expect(result).toBe('fmt:Revenue: fmt:50 (50%)');
    });
  });

  // -- scales ----------------------------------------------------------------

  describe('scales.x.ticks.callback (non-horizontal)', () => {
    it('formats the label via the measure when horizontal', () => {
      const data = makeChartData(['A', 'B'], [[10, 20]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: true, data: data as never },
        makeTheme(),
      );

      options.scales!.x!.ticks!.callback!.call({} as never, 10, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 10);
    });

    it('formats the label via the dimension when not horizontal', () => {
      const data = makeChartData(['A', 'B'], [[10, 20]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      options.scales!.x!.ticks!.callback!.call({} as never, 0, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'A');
    });
  });

  describe('scales.y.ticks.callback (non-horizontal)', () => {
    it('formats the label via the measure when not horizontal', () => {
      const data = makeChartData(['A'], [[100]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      options.scales!.y!.ticks!.callback!.call({} as never, 100, 0, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(measures[0], 100);
    });

    it('formats the label via the dimension when horizontal', () => {
      const data = makeChartData(['A', 'B'], [[10, 20]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: true, data: data as never },
        makeTheme(),
      );

      options.scales!.y!.ticks!.callback!.call({} as never, 1, 1, []);

      expect(mockFormatter.data).toHaveBeenCalledWith(dimension, 'B');
    });
  });

  // -- onClick ---------------------------------------------------------------

  describe('onClick', () => {
    it('does nothing when onBarClicked is not provided', () => {
      const data = makeChartData(['A'], [[10]]);
      const options = getBarChartProOptions(
        { measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      // Should not throw
      options.onClick!({} as never, [], {} as never);
    });

    it('calls onBarClicked with the axis and grouping dimension values from the clicked element', () => {
      const onBarClicked = vi.fn();
      const data = {
        labels: ['Widget'],
        datasets: [{ data: [100], rawLabel: 'North' }],
      };
      const options = getBarChartProOptions(
        { onBarClicked, measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      const element = { index: 0, datasetIndex: 0 };
      const chart = { data };

      options.onClick!({} as never, [element] as never, chart as never);

      expect(onBarClicked).toHaveBeenCalledWith({
        axisDimensionValue: 'Widget',
        groupingDimensionValue: 'North',
      });
    });

    it('calls onBarClicked with nulls when no element is clicked', () => {
      const onBarClicked = vi.fn();
      const data = makeChartData(['Widget'], [[100]]);
      const options = getBarChartProOptions(
        { onBarClicked, measures, dimension, horizontal: false, data: data as never },
        makeTheme(),
      );

      options.onClick!({} as never, [], { data } as never);

      expect(onBarClicked).toHaveBeenCalledWith({
        axisDimensionValue: null,
        groupingDimensionValue: null,
      });
    });
  });

  // -- legend ----------------------------------------------------------------

  it('uses theme legendPosition', () => {
    const data = makeChartData([], []);
    const options = getBarChartProOptions(
      { measures, dimension, horizontal: false, data: data as never },
      { charts: { legendPosition: 'top' } } as never,
    );

    expect(options.plugins!.legend!.position).toBe('top');
  });
});
