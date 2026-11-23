import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const startOfWeek = (date: dayjs.Dayjs, weekStartsOn: number): dayjs.Dayjs =>
  date.subtract((date.day() - weekStartsOn + 7) % 7, 'day').startOf('day');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataRecord = { [key: string]: any };

// A `Date` object always represents a genuine real instant, but so does an ISO
// string carrying an explicit offset (`Z` or `+HH:MM`/`-HH:MM`) — some callers
// (e.g. a live/rolling date-range variable set outside our own picker
// components, or a host app supplying its own dateBounds) hand `dateBounds`/
// `externalDateBounds` through as plain strings rather than `Date` instances,
// and that signal is just as valid as `instanceof Date`.
const hasExplicitTimezoneOffset = (value: unknown): value is string =>
  typeof value === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

// Record values coming back from the query are timezone-naive local wall-clock
// strings (no offset) — dayjs.utc() reads their digits as-is, which is correct.
// A `from`/`to` bound, by contrast, is a real absolute instant whenever it's a
// `Date` or an offset-bearing string, and must be converted via `.tz(tz)` to
// land on the same local digits the record data uses. There's no "already
// local, skip conversion" case to guess at here: every bound our own
// components produce (presets, the custom range picker) is a genuine instant,
// and a host app supplying its own bound is a genuine instant too, even if it
// happens to land on a UTC day boundary (e.g. startOf('day') in UTC) --
// converting unconditionally is always correct, never redundant.
export const resolveBoundary = (rawValue: Date | string | undefined, tz?: string): dayjs.Dayjs => {
  if (!tz || !(rawValue instanceof Date || hasExplicitTimezoneOffset(rawValue))) {
    return dayjs.utc(rawValue);
  }

  return dayjs.utc(dayjs(rawValue).tz(tz).format('YYYY-MM-DDTHH:mm:ss.SSS'));
};
