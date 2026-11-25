import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import 'dayjs/locale/en-gb';
import { exceedsFillGapsLimit, MAX_FILL_GAPS_BUCKETS, startOfWeek } from './charts.fillGaps.utils';

dayjs.extend(utc);

const thu = dayjs.utc('2026-11-05T15:30:00.000');

describe('startOfWeek', () => {
  afterEach(() => {
    dayjs.locale('en');
  });

  it('starts on Sunday when weekStartsOn is 0', () => {
    expect(startOfWeek(thu, 0).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('returns the same day when the date is the week start', () => {
    expect(startOfWeek(dayjs.utc('2026-11-01'), 0).toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(startOfWeek(dayjs.utc('2026-11-01'), 1).toISOString()).toBe('2026-10-26T00:00:00.000Z');
  });

  it('supports any weekday', () => {
    expect(startOfWeek(thu, 6).toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(startOfWeek(thu, 4).toISOString()).toBe('2026-11-05T00:00:00.000Z');
  });

  it('does not change with the dayjs locale', () => {
    dayjs.locale('en-gb');
    expect(startOfWeek(thu, 0).toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(startOfWeek(thu, 1).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });
});

describe('exceedsFillGapsLimit', () => {
  it('is false for a realistic range', () => {
    expect(exceedsFillGapsLimit(dayjs.utc('2010-06-14'), dayjs.utc('2026-11-25'), 'week')).toBe(
      false,
    );
  });

  it('is true when an outlier date stretches the range to year 9999 (TPS-1567)', () => {
    expect(exceedsFillGapsLimit(dayjs.utc('2010-06-14'), dayjs.utc('9999-12-27'), 'week')).toBe(
      true,
    );
  });

  it('allows exactly the max number of buckets', () => {
    const from = dayjs.utc('2020-01-01');
    expect(exceedsFillGapsLimit(from, from.add(MAX_FILL_GAPS_BUCKETS, 'day'), 'day')).toBe(false);
    expect(exceedsFillGapsLimit(from, from.add(MAX_FILL_GAPS_BUCKETS + 1, 'day'), 'day')).toBe(
      true,
    );
  });
});
