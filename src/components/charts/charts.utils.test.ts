import type { Dimension, Measure } from '@embeddable.com/core';
import { getDatalabelPercentage, groupTailAsOther } from './charts.utils';
import { i18n } from '../../theme/i18n/i18n';

// -- mocks -------------------------------------------------------------------

vi.mock('../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

// -- helpers -----------------------------------------------------------------

const makeDimension = (name = 'category'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'value'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

describe('getDatalabelPercentage', () => {
  it('returns 25% when value is 25 out of 100', () => {
    expect(getDatalabelPercentage(25, [25, 25, 25, 25])).toBe('25%');
  });

  it('returns 33.33% for 1 out of 3', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1])).toBe('33.33%');
  });

  it('returns 66.67% for 2 out of 3', () => {
    expect(getDatalabelPercentage(2, [1, 1, 1])).toBe('66.67%');
  });

  it('returns 100% when value equals the total', () => {
    expect(getDatalabelPercentage(5, [5])).toBe('100%');
  });

  it('returns 0% when value is 0', () => {
    expect(getDatalabelPercentage(0, [1, 2, 3])).toBe('0%');
  });

  it('strips trailing decimal zeros (25.00 → 25)', () => {
    // toFixed(2) gives "25.00"; parseFloat strips it to 25
    expect(getDatalabelPercentage(1, [4])).toBe('25%');
  });

  it('handles string numbers in the data array', () => {
    // data is unknown[], so strings are valid — parseFloat handles them
    expect(getDatalabelPercentage(50, ['50', '50'] as unknown[])).toBe('50%');
  });
});

describe('groupTailAsOther', () => {
  const dimension = makeDimension('category');
  const measure = makeMeasure('value');

  it('returns data unchanged when maxItems is not provided', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'C', value: 3 },
    ];
    expect(groupTailAsOther(data, dimension, [measure])).toBe(data);
  });

  it('returns data unchanged when data length is within maxItems', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
    ];
    expect(groupTailAsOther(data, dimension, [measure], 3)).toBe(data);
  });

  it('returns data unchanged when data length equals maxItems', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
    ];
    expect(groupTailAsOther(data, dimension, [measure], 2)).toBe(data);
  });

  it('groups tail rows into a single "Other" row when data exceeds maxItems', () => {
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C', value: 30 },
      { category: 'D', value: 40 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ category: 'A', value: 10 });
    expect(result[1]).toEqual({ category: 'B', value: 20 });
    expect(result[2]).toEqual({ category: 't(common.other)', value: 70 }); // C(30) + D(40)
  });

  it('uses i18n.t("common.other") as the dimension value for the aggregated row', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'C', value: 3 },
    ];

    groupTailAsOther(data, dimension, [measure], 2);

    expect(vi.mocked(i18n.t)).toHaveBeenCalledWith('common.other');
  });

  it('aggregates multiple measures independently in the "Other" row', () => {
    const m1 = makeMeasure('sales');
    const m2 = makeMeasure('units');
    const data = [
      { category: 'A', sales: 100, units: 5 },
      { category: 'B', sales: 200, units: 10 },
      { category: 'C', sales: 300, units: 15 },
    ];

    const result = groupTailAsOther(data, dimension, [m1, m2], 2);

    expect(result).toHaveLength(2);
    expect(result[1]?.sales).toBe(500); // B(200) + C(300)
    expect(result[1]?.units).toBe(25); // B(10) + C(15)
  });

  it('treats missing measure values as 0 during aggregation', () => {
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C' }, // no value field
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(20) + C(0) = 20
    expect(result[1]?.value).toBe(20);
  });

  it('defaults data to an empty array when undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = groupTailAsOther(undefined as any, dimension, [measure], 3);
    expect(result).toEqual([]);
  });
});
