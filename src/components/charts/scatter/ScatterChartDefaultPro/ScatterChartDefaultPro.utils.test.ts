import {
  CUBE_DIMENSION_TYPE_TIME,
  type DataResponse,
  type Dimension,
  type Measure,
} from '@embeddable.com/core';
import {
  getDimensionFieldName,
  getScatterChartProData,
  getScatterChartProOptions,
  measureToNullableNumber,
} from './ScatterChartDefaultPro.utils';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { Theme } from '../../../../theme/theme.types';
import type { TooltipItem } from 'chart.js';
import type { ScatterDatasetWithOriginal } from '@embeddable.com/remarkable-ui';
import type { DimensionOrMeasure } from '@embeddable.com/core';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));
vi.mock('../../../../theme/styles/styles.utils', () => ({ getDimensionMeasureColor: vi.fn() }));
vi.mock('@embeddable.com/remarkable-ui', () => ({ getChartColors: vi.fn() }));

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

describe('getDimensionFieldName', () => {
  it('returns dimension name for non-time dimensions', () => {
    const d = makeDimension({ name: 'country', nativeType: 'string' });
    expect(getDimensionFieldName(d)).toBe('country');
  });

  it('appends granularity for time dimensions when set', () => {
    const d = makeDimension({
      name: 'created',
      nativeType: CUBE_DIMENSION_TYPE_TIME,
      inputs: { granularity: 'day' },
    });
    expect(getDimensionFieldName(d)).toBe('created.day');
  });

  it('returns only name for time dimension without granularity', () => {
    const d = makeDimension({
      name: 'created',
      nativeType: CUBE_DIMENSION_TYPE_TIME,
      inputs: {},
    });
    expect(getDimensionFieldName(d)).toBe('created');
  });
});

describe('measureToNullableNumber', () => {
  it('returns null for nullish and non-finite numbers', () => {
    expect(measureToNullableNumber(null)).toBeNull();
    expect(measureToNullableNumber(undefined)).toBeNull();
    expect(measureToNullableNumber(Number.NaN)).toBeNull();
    expect(measureToNullableNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(measureToNullableNumber(Number.NEGATIVE_INFINITY)).toBeNull();
    expect(measureToNullableNumber('x')).toBeNull();
  });

  it('parses finite numbers', () => {
    expect(measureToNullableNumber(3)).toBe(3);
    expect(measureToNullableNumber('12.5')).toBe(12.5);
  });
});

describe('getScatterChartProData', () => {
  let mockFormatter: ReturnType<typeof makeMockFormatter>;

  beforeEach(() => {
    mockFormatter = makeMockFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(mockFormatter as never);
    vi.mocked(getChartColors).mockReturnValue(['#c0', '#c1', '#c2'] as never);
    vi.mocked(getDimensionMeasureColor).mockImplementation(({ color, index }) =>
      color === 'background' ? `#bg-${index}` : `#bd-${index}`,
    );
  });

  it('returns empty dataset when there are no rows', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.datasets[0]!.data).toEqual([]);
  });

  it('treats undefined data like an empty array', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: undefined as unknown as DataResponse['data'],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.datasets[0]!.data).toEqual([]);
  });

  it('maps null measures and null point dimension to labels', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [{ point: null, x: null, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    const pt = result.datasets[0]!.data[0]!;
    expect(pt?.x).toBeNull();
    expect(pt?.y).toBe(2);
    expect(pt?.pointLabel).toBe('NV');
    expect(pt?.rowIndex).toBe(0);
  });

  it('splits rows into datasets by group-by and places null group last in order', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'g', title: 'G' });

    const result = getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, g: 'B' },
          { point: 'P2', x: 2, y: 2, g: null },
          { point: 'P3', x: 3, y: 3, g: 'A' },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(3);
    expect(result.datasets.map((d) => d.label)).toEqual(['fmt:A', 'fmt:B', 'NV']);
    expect(result.datasets[0]!.data[0]!.rowIndex).toBe(2);
    expect(result.datasets[1]!.data[0]!.rowIndex).toBe(0);
    expect(result.datasets[2]!.data[0]!.rowIndex).toBe(1);
  });

  it('merges rows that share the same group into one dataset', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'g' });

    const result = getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, g: 'A' },
          { point: 'P2', x: 2, y: 2, g: 'A' },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0]!.data).toHaveLength(2);
    expect(result.datasets[0]!.data[0]!.rowIndex).toBe(0);
    expect(result.datasets[0]!.data[1]!.rowIndex).toBe(1);
  });

  it('applies manual point color for a single series', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();

    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
        pointColor: '#abc',
      },
      makeTheme(),
    );

    expect(result.datasets[0]!.pointBackgroundColor).toBe('#abc');
    expect(result.datasets[0]!.pointBorderColor).toBe('#abc');
    expect(getDimensionMeasureColor).not.toHaveBeenCalled();
  });

  it('applies manual point color across grouped series', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'g' });

    const result = getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, g: 'A' },
          { point: 'P2', x: 2, y: 2, g: 'B' },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
        pointColor: '#fed',
      },
      makeTheme(),
    );

    expect(result.datasets[0]!.pointBackgroundColor).toBe('#fed');
    expect(result.datasets[1]!.pointBackgroundColor).toBe('#fed');
  });

  it('uses getDimensionMeasureColor from xMeasure when pointColor is absent', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();

    const x = makeMeasure('revenue');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    getScatterChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(getDimensionMeasureColor).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionOrMeasure: x,
        color: 'background',
        value: 'revenue',
        index: 0,
      }),
    );
    expect(getDimensionMeasureColor).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionOrMeasure: x,
        color: 'border',
        value: 'revenue',
        index: 0,
      }),
    );
  });

  it('treats whitespace-only pointColor as absent and uses auto color', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();

    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });

    getScatterChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
        pointColor: '   ',
      },
      makeTheme(),
    );

    expect(getDimensionMeasureColor).toHaveBeenCalled();
  });

  it('sets single-series dataset label from yMeasure title', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('units', { title: 'Units sold' });
    const pointDim = makeDimension({ name: 'point' });

    const result = getScatterChartProData(
      {
        data: [{ point: 'a', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(mockFormatter.dimensionOrMeasureTitle).toHaveBeenCalledWith(y);
    expect(result.datasets[0]!.label).toBe('Units sold');
  });

  it('formats non-null point dimension values via themeFormatter.data', () => {
    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'country' });

    const result = getScatterChartProData(
      {
        data: [{ country: 'US', x: 1, y: 2 }],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    expect(mockFormatter.data).toHaveBeenCalledWith(pointDim, 'US');
    expect(result.datasets[0]!.data[0]!.pointLabel).toBe('fmt:US');
    expect(result.datasets[0]!.data[0]!.label).toBe('fmt:US');
  });

  it('passes group color keys region.<key> and region.null to getDimensionMeasureColor', () => {
    vi.mocked(getDimensionMeasureColor).mockClear();

    const x = makeMeasure('x');
    const y = makeMeasure('y');
    const pointDim = makeDimension({ name: 'point' });
    const groupDim = makeDimension({ name: 'region', title: 'Region' });

    getScatterChartProData(
      {
        data: [
          { point: 'P1', x: 1, y: 1, region: 'East' },
          { point: 'P2', x: 2, y: 2, region: null },
        ],
        xMeasure: x,
        yMeasure: y,
        pointDimension: pointDim,
        groupByDimension: groupDim,
        noValueLabel: 'NV',
      },
      makeTheme(),
    );

    const valueArgs = vi.mocked(getDimensionMeasureColor).mock.calls.map((c) => c[0].value);

    expect(valueArgs.filter((v) => v === 'region.East')).toHaveLength(2);
    expect(valueArgs.filter((v) => v === 'region.null')).toHaveLength(2);
    expect(
      vi
        .mocked(getDimensionMeasureColor)
        .mock.calls.every((c) => c[0].dimensionOrMeasure === groupDim),
    ).toBe(true);
  });
});

describe('getScatterChartProOptions', () => {
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
  const NO_VALUE = 'No value';

  describe('tick callbacks', () => {
    it('formats x axis ticks using themeFormatter.data with xMeasure', () => {
      const opts = getScatterChartProOptions(
        { xMeasure, yMeasure, noValueLabel: NO_VALUE },
        {} as Theme,
      );
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(1_000_000)).toBe('data:x:1000000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xMeasure, 1_000_000);
    });

    it('formats y axis ticks using themeFormatter.data with yMeasure', () => {
      const opts = getScatterChartProOptions(
        { xMeasure, yMeasure, noValueLabel: NO_VALUE },
        {} as Theme,
      );
      const yCb = opts.scales?.y?.ticks?.callback as (v: string | number) => string;

      expect(yCb(2)).toBe('data:y:2');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(yMeasure, 2);
    });

    it('uses the measure formatter for currency measures', () => {
      const xUsd = {
        name: 'revenue',
        title: 'Revenue',
        nativeType: 'number',
        inputs: { currency: 'USD' },
      } as unknown as Measure;

      const opts = getScatterChartProOptions(
        { xMeasure: xUsd, yMeasure, noValueLabel: NO_VALUE },
        {} as Theme,
      );
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(25_000)).toBe('data:revenue:25000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xUsd, 25_000);
    });
  });

  describe('tooltip label', () => {
    it('formats tooltip using originalData when available', () => {
      const opts = getScatterChartProOptions(
        { xMeasure, yMeasure, noValueLabel: NO_VALUE },
        {} as Theme,
      );
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: 'Series A',
          originalData: [{ x: 10, y: 20 }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 10, y: 20 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe('Series A: (data:x:10, data:y:20)');
    });

    it('returns noValueLabel for null measure values in tooltip', () => {
      const opts = getScatterChartProOptions(
        { xMeasure, yMeasure, noValueLabel: NO_VALUE },
        {} as Theme,
      );
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: '',
          originalData: [{ x: null, y: null }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 0, y: 0 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe(`(${NO_VALUE}, ${NO_VALUE})`);
    });
  });
});
