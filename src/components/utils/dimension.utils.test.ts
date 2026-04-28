import { CUBE_DIMENSION_TYPE_TIME, Dimension } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from './dimension.utils';

const DIMENSION_TYPE = 'dimension' as const;

const makeTimeDimension = (granularity?: string): Dimension =>
  ({
    name: 'Orders.createdAt',
    title: 'Created At',
    nativeType: CUBE_DIMENSION_TYPE_TIME,
    __type__: DIMENSION_TYPE,
    inputs: granularity ? { granularity } : {},
  }) as unknown as Dimension;

const makeNonTimeDimension = (): Dimension =>
  ({
    name: 'Orders.status',
    title: 'Status',
    nativeType: 'string',
    __type__: DIMENSION_TYPE,
    inputs: {},
  }) as unknown as Dimension;

// ---------------------------------------------------------------------------

describe('getTimeRangeFromDimensionValue', () => {
  describe('guard clauses', () => {
    it('returns undefined when value is undefined', () => {
      expect(
        getTimeRangeFromDimensionValue({ value: undefined, dimension: makeTimeDimension() }),
      ).toBeUndefined();
    });

    it('returns undefined when dimension is not a time dimension', () => {
      expect(
        getTimeRangeFromDimensionValue({ value: '2024-01-15', dimension: makeNonTimeDimension() }),
      ).toBeUndefined();
    });

    it('returns undefined when dimension is undefined', () => {
      expect(
        getTimeRangeFromDimensionValue({ value: '2024-01-15', dimension: undefined }),
      ).toBeUndefined();
    });
  });

  describe('granularity resolution', () => {
    it('uses stateGranularity when provided, over dimension granularity', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-01-15',
        stateGranularity: 'month',
        dimension: makeTimeDimension('day'),
      });
      // month bucket for 2024-01-15: Jan 1 → Jan 31
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('falls back to dimension.inputs.granularity when stateGranularity is absent', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-03-10',
        dimension: makeTimeDimension('month'),
      });
      expect(result?.from).toEqual(new Date('2024-03-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('defaults to day granularity when neither stateGranularity nor dimension granularity is set', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-06-15',
        dimension: makeTimeDimension(),
      });
      expect(result?.from).toEqual(new Date('2024-06-15T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-06-15T23:59:59.999Z'));
    });
  });

  describe('granularity buckets', () => {
    it('day: covers exactly 24 hours', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-03-15',
        stateGranularity: 'day',
        dimension: makeTimeDimension(),
      });
      expect(result?.from).toEqual(new Date('2024-03-15T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-03-15T23:59:59.999Z'));
    });

    it('month: covers the full calendar month', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-02-10',
        stateGranularity: 'month',
        dimension: makeTimeDimension(),
      });
      // Feb 2024 is a leap year
      expect(result?.from).toEqual(new Date('2024-02-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-02-29T23:59:59.999Z'));
    });

    it('year: covers Jan 1 to Dec 31', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-07-04',
        stateGranularity: 'year',
        dimension: makeTimeDimension(),
      });
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-12-31T23:59:59.999Z'));
    });

    // Note: 'quarter' granularity requires dayjs's quarter-of-year plugin which is not loaded;
    // startOf('quarter') silently falls back to day behaviour.

    it('week: covers Mon–Sun (ISO week)', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-01-10', // Wednesday
        stateGranularity: 'week',
        dimension: makeTimeDimension(),
      });
      // ISO week: Mon 2024-01-08 → Sun 2024-01-14
      expect(result?.from).toEqual(new Date('2024-01-08T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-14T23:59:59.999Z'));
    });

    it('hour: covers a single hour', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-03-15T14:30:00',
        stateGranularity: 'hour',
        dimension: makeTimeDimension(),
      });
      expect(result?.from).toEqual(new Date('2024-03-15T14:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-03-15T14:59:59.999Z'));
    });
  });

  describe('relativeTimeString', () => {
    it('always sets relativeTimeString to undefined', () => {
      const result = getTimeRangeFromDimensionValue({
        value: '2024-01-15',
        stateGranularity: 'day',
        dimension: makeTimeDimension(),
      });
      expect(result?.relativeTimeString).toBeUndefined();
    });
  });
});
