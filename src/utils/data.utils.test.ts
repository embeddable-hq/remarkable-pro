import { isValidISODate } from './data.utils';

describe('isValidISODate', () => {
  it('returns true for a valid ISO date-time string', () => {
    expect(isValidISODate('2024-01-15T10:30:00.000')).toBe(true);
  });

  it('returns true for midnight', () => {
    expect(isValidISODate('2024-12-31T00:00:00.000')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidISODate('')).toBe(false);
  });

  it('returns false for a date-only string', () => {
    expect(isValidISODate('2024-01-15')).toBe(false);
  });

  it('returns false for a string with a timezone offset', () => {
    expect(isValidISODate('2024-01-15T10:30:00.000Z')).toBe(false);
  });

  it('returns false for a string with +offset', () => {
    expect(isValidISODate('2024-01-15T10:30:00.000+05:00')).toBe(false);
  });

  it('returns false for a string missing milliseconds', () => {
    expect(isValidISODate('2024-01-15T10:30:00')).toBe(false);
  });

  it('returns false for a plain text string', () => {
    expect(isValidISODate('not-a-date')).toBe(false);
  });

  it('returns false for a partial ISO string', () => {
    expect(isValidISODate('2024-01-15T10:30')).toBe(false);
  });
});
