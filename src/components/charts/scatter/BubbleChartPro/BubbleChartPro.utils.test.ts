import {
  CUBE_DIMENSION_TYPE_TIME,
  type DataResponse,
  type Dimension,
  type Measure,
} from '@embeddable.com/core';
import {
  createBubbleClickHandler,
  getBubblePointClickData,
  getBubbleChartProData,
  getBubbleChartProOptions,
} from './BubbleChartPro.utils';
import { measureToNullableNumber } from '../scatter.utils';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { Theme } from '../../../../theme/theme.types';
import type { TooltipItem } from 'chart.js';
import type { BubbleDatasetExtended } from '@embeddable.com/remarkable-ui';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import { getDimensionFieldName } from '../../../../utils/data.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(),
  getStyleNumber: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDimension = (overrides: Record<string, any> = {}): Dimension =>
  ({
    name: 'point',
    title: 'Point',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as Dimension;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (name: string, overrides: Record<string, any> = {}): Measure =>
  ({
    name,
    title: name,
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const makeTheme = () => ({ charts: { legendPosition: 'bottom' } }) as never;

const makeMockFormatter = () => ({
  data: vi.fn((_, value) => `fmt:${value}`),
  dimensionOrMeasureTitle: vi.fn((m: Measure) => m.title ?? m.name),
});

describe('measureToNullableNumber (re-exported)', () => {
  it('returns null for nullish and non-finite numbers', () => {
    expect(measureToNullableNumber(null)).toBeNull();
    expect(measureToNullableNumber(undefined)).toBeNull();
    expect(measureToNullableNumber(Number.NaN)).toBeNull();
    expect(measureToNullableNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('parses finite numbers', () => {
    expect(measureToNullableNumber(3)).toBe(3);
    expect(measureToNullableNumber('12.5')).toBe(12.5);
  });
});

describe('getDimensionFieldName', () => {
  it('returns dimension name for non-time dimensions', () => {
    expect(getDimensionFieldName(makeDimension({ name: 'country' }))).toBe('country');
  });

  it('appends granularity for time dimensions when set', () => {
    const d = makeDimension({
      name: 'created',
      nativeType: CUBE_DIMENSION_TYPE_TIME,
      inputs: { granularity: 'day' },
    });
    expect(getDimensionFieldName(d)).toBe('created.day');
  });
});

describe('getBubbleChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
  });

  const x = makeMeasure('x');
  const y = makeMeasure('y');
  const s = makeMeasure('s');
  const pointDim = () => makeDimension({ name: 'point' });

  it('returns empty dataset when there are no rows', () => {
    const result = getBubbleChartProData(
      {
        data: [],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.data).toEqual([]);
  });

  it('treats undefined data like an empty array', () => {
    const result = getBubbleChartProData(
      {
        data: undefined as unknown as DataResponse['data'],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.data).toEqual([]);
  });

  it('includes x, y, and size from the respective measures', () => {
    const result = getBubbleChartProData(
      {
        data: [{ point: 'P1', x: 10, y: 20, s: 50 }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    const pt = result.datasets[0]!.data[0]!;
    expect(pt.x).toBe(10);
    expect(pt.y).toBe(20);
    expect(pt.size).toBe(50);
    expect(pt.rowIndex).toBe(0);
  });

  it('maps null size to null', () => {
    const result = getBubbleChartProData(
      {
        data: [{ point: 'P1', x: 1, y: 2, s: null }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.data[0]!.size).toBeNull();
  });

  it('maps null point dimension to noValueLabel', () => {
    const result = getBubbleChartProData(
      {
        data: [{ point: null, x: 1, y: 2, s: 5 }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.data[0]!.pointLabel).toBe('NV');
  });

  it('splits rows into datasets by group-by and places null group last', () => {
    const groupDim = makeDimension({ name: 'g', title: 'G' });
    const result = getBubbleChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, s: 10, g: 'B' },
          { point: 'P2', x: 2, y: 2, s: 20, g: null },
          { point: 'P3', x: 3, y: 3, s: 30, g: 'A' },
        ],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        groupByDimension: groupDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(result.datasets).toHaveLength(3);
    expect(result.datasets.map((d) => d.label)).toEqual(['fmt:A', 'fmt:B', 'NV']);
  });

  it('applies manual point color override', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();
    const result = getBubbleChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2, s: 5 }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
        pointColor: '#abc',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.backgroundColor).toBe('#abc');
    expect(result.datasets[0]!.borderColor).toBe('#abc');
    expect(getDimensionMeasureColor).not.toHaveBeenCalled();
  });

  it('ignores pointColor override when groupByDimension is set', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();
    const groupDim = makeDimension({ name: 'g', title: 'G' });
    const result = getBubbleChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2, s: 5, g: 'A' }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        groupByDimension: groupDim,
        noValueLabel: 'NV',
        pointColor: '#abc',
      },
      makeTheme(),
    );
    expect(result.datasets[0]!.backgroundColor).not.toBe('#abc');
    expect(getDimensionMeasureColor).toHaveBeenCalled();
  });

  it('uses getDimensionMeasureColor when pointColor is absent', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();
    getBubbleChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2, s: 5 }],
        xMeasure: x,
        yMeasure: y,
        sizeMeasure: s,
        pointDimension: pointDim(),
        noValueLabel: 'NV',
      },
      makeTheme(),
    );
    expect(getDimensionMeasureColor).toHaveBeenCalled();
  });
});

describe('getBubblePointClickData', () => {
  const xMeasure = makeMeasure('xVal');
  const yMeasure = makeMeasure('yVal');
  const sizeMeasure = makeMeasure('sVal');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeDatasets = (rowIndex: number) => [{ data: [{ rowIndex }] }] as any;

  it('returns null when dataset index is out of bounds', () => {
    expect(
      getBubblePointClickData(
        { datasetIndex: 1, index: 0 },
        makeDatasets(0),
        [{ point: 'P1', xVal: 10, yVal: 20, sVal: 5 }],
        xMeasure,
        yMeasure,
        sizeMeasure,
        makeDimension({ name: 'point' }),
      ),
    ).toBeNull();
  });

  it('returns null when row index exceeds data length', () => {
    expect(
      getBubblePointClickData(
        { datasetIndex: 0, index: 0 },
        makeDatasets(5),
        [{ point: 'P1', xVal: 10, yVal: 20, sVal: 5 }],
        xMeasure,
        yMeasure,
        sizeMeasure,
        makeDimension({ name: 'point' }),
      ),
    ).toBeNull();
  });

  it('returns click arg including sizeMeasureValue', () => {
    const result = getBubblePointClickData(
      { datasetIndex: 0, index: 0 },
      makeDatasets(0),
      [{ point: 'P1', xVal: 10, yVal: 20, sVal: 50 }],
      xMeasure,
      yMeasure,
      sizeMeasure,
      makeDimension({ name: 'point' }),
    );
    expect(result).toEqual({
      xMeasureValue: '10',
      yMeasureValue: '20',
      sizeMeasureValue: '50',
      pointDimensionValue: 'P1',
      groupByDimensionValue: null,
      pointDimensionTimeRange: undefined,
      groupByDimensionTimeRange: undefined,
    });
  });

  it('includes groupByDimensionValue when groupByDimension is provided', () => {
    const result = getBubblePointClickData(
      { datasetIndex: 0, index: 0 },
      makeDatasets(0),
      [{ point: 'P1', xVal: 10, yVal: 20, sVal: 5, g: 'GroupA' }],
      xMeasure,
      yMeasure,
      sizeMeasure,
      makeDimension({ name: 'point' }),
      makeDimension({ name: 'g' }),
    );
    expect(result?.groupByDimensionValue).toBe('GroupA');
  });

  it('nulls out dimension values and returns time ranges for time dimensions', () => {
    const result = getBubblePointClickData(
      { datasetIndex: 0, index: 0 },
      makeDatasets(0),
      [{ point: '2024-01-01', xVal: 10, yVal: 20, sVal: 5, g: '2024-02-01' }],
      xMeasure,
      yMeasure,
      sizeMeasure,
      makeDimension({ name: 'point', nativeType: 'time' }),
      makeDimension({ name: 'g', nativeType: 'time' }),
    );
    expect(result?.pointDimensionValue).toBeUndefined();
    expect(result?.groupByDimensionValue).toBeUndefined();
    expect(result?.pointDimensionTimeRange).toBeDefined();
    expect(result?.groupByDimensionTimeRange).toBeDefined();
  });
});

describe('createBubbleClickHandler', () => {
  const xMeasure = makeMeasure('xVal');
  const yMeasure = makeMeasure('yVal');
  const sizeMeasure = makeMeasure('sVal');
  const pointDimension = makeDimension({ name: 'point' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeDatasets = (rowIndex: number) => [{ data: [{ rowIndex }] }] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeClickArgs = (elements: any[]) => ({ elementAtEvent: elements }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeResults = (data: Record<string, unknown>[]) => ({ data }) as any as DataResponse;

  it('does nothing when elementAtEvent is empty', () => {
    const onPointClick = vi.fn();
    const handler = createBubbleClickHandler({
      datasets: makeDatasets(0),
      results: makeResults([{ point: 'P1', xVal: 1, yVal: 2, sVal: 5 }]),
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
      onPointClick,
    });
    handler(makeClickArgs([]));
    expect(onPointClick).not.toHaveBeenCalled();
  });

  it('calls onPointClick with click data including sizeMeasureValue', () => {
    const onPointClick = vi.fn();
    const handler = createBubbleClickHandler({
      datasets: makeDatasets(0),
      results: makeResults([{ point: 'P1', xVal: 10, yVal: 20, sVal: 50 }]),
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
      onPointClick,
    });
    handler(makeClickArgs([{ datasetIndex: 0, index: 0 }]));
    expect(onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({ xMeasureValue: '10', yMeasureValue: '20', sizeMeasureValue: '50' }),
    );
  });

  it('does not call onPointClick when getPointClickData returns null', () => {
    const onPointClick = vi.fn();
    const handler = createBubbleClickHandler({
      datasets: makeDatasets(99),
      results: makeResults([{ point: 'P1', xVal: 1, yVal: 2, sVal: 5 }]),
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
      onPointClick,
    });
    handler(makeClickArgs([{ datasetIndex: 0, index: 0 }]));
    expect(onPointClick).not.toHaveBeenCalled();
  });

  it('does not throw when onPointClick is not provided', () => {
    const handler = createBubbleClickHandler({
      datasets: makeDatasets(0),
      results: makeResults([{ point: 'P1', xVal: 1, yVal: 2, sVal: 5 }]),
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
    });
    expect(() => handler(makeClickArgs([{ datasetIndex: 0, index: 0 }]))).not.toThrow();
  });
});

describe('getBubbleChartProOptions', () => {
  let dataFn: GetThemeFormatter['data'];

  beforeEach(() => {
    dataFn = vi.fn(
      (m: DimensionOrMeasure, value: unknown) => `data:${m.name}:${value}`,
    ) as GetThemeFormatter['data'];

    vi.mocked(getThemeFormatter).mockReturnValue({
      string: (key) => key,
      number: (v) => String(v),
      dateTime: (d) => d.toISOString(),
      dimensionOrMeasureTitle: (key) => key.title ?? key.name,
      data: dataFn,
    });
  });

  const xMeasure = {
    name: 'x',
    title: 'X',
    nativeType: 'number',
    inputs: {},
  } as unknown as Measure;
  const yMeasure = {
    name: 'y',
    title: 'Y',
    nativeType: 'number',
    inputs: {},
  } as unknown as Measure;
  const sizeMeasure = {
    name: 'sz',
    title: 'Size',
    nativeType: 'number',
    inputs: {},
  } as unknown as Measure;
  const NO_VALUE = 'No value';

  it('formats x axis ticks using themeFormatter.data', () => {
    const opts = getBubbleChartProOptions(
      { xMeasure, yMeasure, sizeMeasure, noValueLabel: NO_VALUE },
      {} as Theme,
    );
    const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;
    expect(xCb(1000)).toBe('data:x:1000');
  });

  it('formats y axis ticks using themeFormatter.data', () => {
    const opts = getBubbleChartProOptions(
      { xMeasure, yMeasure, sizeMeasure, noValueLabel: NO_VALUE },
      {} as Theme,
    );
    const yCb = opts.scales?.y?.ticks?.callback as (v: string | number) => string;
    expect(yCb(2)).toBe('data:y:2');
  });

  it('tooltip label includes x, y, and size formatted values as separate lines', () => {
    const opts = getBubbleChartProOptions(
      { xMeasure, yMeasure, sizeMeasure, noValueLabel: NO_VALUE },
      {} as Theme,
    );
    const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
      ctx: TooltipItem<'bubble'>,
    ) => string[];

    const ctx = {
      dataset: {
        label: 'Series A',
        originalData: [{ x: 10, y: 20, size: 50 }],
        data: [],
      } as unknown as BubbleDatasetExtended,
      dataIndex: 0,
    } as unknown as TooltipItem<'bubble'>;

    expect(labelFn(ctx)).toEqual(['X: data:x:10', 'Y: data:y:20', 'Size: data:sz:50']);
  });

  it('tooltip returns noValueLabel for null size', () => {
    const opts = getBubbleChartProOptions(
      { xMeasure, yMeasure, sizeMeasure, noValueLabel: NO_VALUE },
      {} as Theme,
    );
    const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
      ctx: TooltipItem<'bubble'>,
    ) => string[];

    const ctx = {
      dataset: {
        label: '',
        originalData: [{ x: 1, y: 2, size: null }],
        data: [],
      } as unknown as BubbleDatasetExtended,
      dataIndex: 0,
    } as unknown as TooltipItem<'bubble'>;

    expect(labelFn(ctx)).toEqual(['X: data:x:1', 'Y: data:y:2', `Size: ${NO_VALUE}`]);
  });
});
