import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { useFillGaps } from './charts.fillGaps.hooks';
import { getLineChartComparisonProData } from './lines/LineChartComparisonDefaultPro/LineChartComparisonDefaultPro.utils';

const mockTheme = {
  defaults: { dateRangesOptions: [] },
  clientContext: { timezone: 'UTC' },
  charts: {},
};

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => mockTheme),
}));

vi.mock('../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_: unknown, value: unknown) => value),
    dimensionOrMeasureTitle: vi.fn((m: { title?: string }) => m.title ?? ''),
  })),
}));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  getChartColors: vi.fn(() => []),
  getChartjsAxisOptionsScalesTicksDefault: vi.fn(() => ({})),
  getChartjsAxisOptionsScalesTitle: vi.fn(() => ({})),
  getStyleNumber: vi.fn(() => 5),
}));
vi.mock('./charts.utils', () => ({ getDimensionWithoutTruncation: vi.fn((d) => d) }));
vi.mock('../../theme/styles/styles.utils', () => ({
  getDimensionMeasureColor: vi.fn(() => '#000'),
}));
vi.mock('../../utils/color.utils', () => ({
  isColorValid: vi.fn(() => false),
  setColorAlpha: vi.fn((c: string) => c),
}));
vi.mock('../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn((k: string) => k) } }));

const DIMENSION_NAME = 'entries_mysql.submitted_at';
const MEASURE_NAME = 'entries_mysql.count_submitted';

const day = (isoDay: string) => `${isoDay}T00:00:00.000`;

export const REPRODUCTION_DATASET: DataResponse = {
  isLoading: false,
  error: undefined,
  data: [
    { [DIMENSION_NAME]: day('2026-07-01'), [MEASURE_NAME]: 1 },
    { [DIMENSION_NAME]: day('2026-07-07'), [MEASURE_NAME]: 1 },
    { [DIMENSION_NAME]: day('2026-07-08'), [MEASURE_NAME]: 3 },
    { [DIMENSION_NAME]: day('2026-07-09'), [MEASURE_NAME]: 1 },
    { [DIMENSION_NAME]: day('2026-07-13'), [MEASURE_NAME]: 1 },
    { [DIMENSION_NAME]: day('2026-07-14'), [MEASURE_NAME]: 2 },
    { [DIMENSION_NAME]: day('2026-07-20'), [MEASURE_NAME]: 2 },
    { [DIMENSION_NAME]: day('2026-07-21'), [MEASURE_NAME]: 5 },
    { [DIMENSION_NAME]: day('2026-07-22'), [MEASURE_NAME]: 2 },
    { [DIMENSION_NAME]: day('2026-07-23'), [MEASURE_NAME]: 1 },
  ],
} as unknown as DataResponse;

const DATE_RANGE = {
  relativeTimeString: undefined,
  from: new Date('2026-06-29T00:00:00.000Z'),
  to: new Date('2026-07-28T23:59:59.999Z'),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeXAxis = (inputs: Record<string, any> = {}): Dimension =>
  ({
    name: DIMENSION_NAME,
    title: 'Submitted at',
    nativeType: 'time',
    inputs: {
      granularity: 'day',
      dateBounds: DATE_RANGE,
      ignoreEmptyDate: false,
      ...inputs,
    },
  }) as unknown as Dimension;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMeasure = (inputs: Record<string, any> = {}): Measure =>
  ({
    name: MEASURE_NAME,
    title: 'Submitted',
    nativeType: 'number',
    inputs,
  }) as unknown as Measure;

const runFillGaps = (dimension: Dimension) =>
  renderHook(() =>
    useFillGaps({
      results: REPRODUCTION_DATASET,
      dimension,
      externalDateBounds: DATE_RANGE,
    }),
  ).result.current;

const EXPECTED_BUCKETS = 30;
const GAP_DAY = day('2026-07-02');
const PRESENT_DAY = day('2026-07-08');

describe('useFillGaps — empty-date reproduction', () => {
  it('fills every missing day as a date-only placeholder (root cause of the gap)', () => {
    const filled = runFillGaps(makeXAxis());

    expect(filled.data).toHaveLength(EXPECTED_BUCKETS);

    const gapRow = filled.data?.find((row) => row[DIMENSION_NAME] === GAP_DAY);
    const presentRow = filled.data?.find((row) => row[DIMENSION_NAME] === PRESENT_DAY);

    expect(gapRow).toBeDefined();
    expect(gapRow?.[MEASURE_NAME]).toBeUndefined();
    expect(presentRow?.[MEASURE_NAME]).toBe(3);
  });

  it('omits missing days entirely when "Ignore empty dates" is on', () => {
    const filled = runFillGaps(makeXAxis({ ignoreEmptyDate: true }));

    expect(filled.data).toHaveLength(10);
    expect(filled.data?.some((row) => row[DIMENSION_NAME] === GAP_DAY)).toBe(false);
  });
});

describe('Connect gaps — end-to-end line data', () => {
  const buildChartValues = (connectGaps: boolean) => {
    const xAxis = makeXAxis({ connectGaps });
    const filled = runFillGaps(xAxis);
    const chartData = getLineChartComparisonProData(
      {
        data: filled.data,
        dataComparison: undefined,
        dimension: xAxis,
        measures: [makeMeasure()],
        hasMinMaxYAxisRange: false,
      },
      {} as never,
    );
    const gapIndex = (chartData.labels as string[]).indexOf(GAP_DAY);
    const presentIndex = (chartData.labels as string[]).indexOf(PRESENT_DAY);
    return { data: chartData.datasets[0]?.data as (number | null)[], gapIndex, presentIndex };
  };

  it('leaves gaps as null by default (connectGaps off) → line is NOT connected', () => {
    const { data, gapIndex, presentIndex } = buildChartValues(false);

    expect(data[gapIndex]).toBeNull();
    expect(data.some((v) => v === null)).toBe(true);
    expect(data[presentIndex]).toBe(3);
  });

  it('fills gaps with 0 when connectGaps is on → line IS connected', () => {
    const { data, gapIndex, presentIndex } = buildChartValues(true);

    expect(data[gapIndex]).toBe(0);
    expect(data.some((v) => v === null)).toBe(false);
    expect(data[presentIndex]).toBe(3);
  });
});
