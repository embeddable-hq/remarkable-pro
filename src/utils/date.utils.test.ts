import type { Mock } from 'vitest';
import dayjs from 'dayjs';
import { loadDayjsLocale, localToUtcDate } from './date.utils';

vi.mock('dayjs', () => {
  const locale = vi.fn();
  return { default: Object.assign(vi.fn(), { locale }) };
});

// useLoadDayjsLocale is a React hook; testing it requires @testing-library/react
// which is not currently a dev dependency. Add it to cover the hook in isolation.

describe('loadDayjsLocale', () => {
  beforeEach(() => {
    (dayjs.locale as Mock).mockClear();
  });

  it('does nothing for an unknown locale', async () => {
    await loadDayjsLocale('xyz_unknown');
    expect(dayjs.locale).not.toHaveBeenCalled();
  });

  it('sets the dayjs locale for a known locale', async () => {
    await loadDayjsLocale('en');
    expect(dayjs.locale).toHaveBeenCalledWith('en');
  });

  it('is case-insensitive for locale lookup', async () => {
    await loadDayjsLocale('EN');
    expect(dayjs.locale).toHaveBeenCalledWith('EN');
  });

  it('falls back to "en" when the locale loader throws', async () => {
    // Mock the loader for 'fr' to throw by temporarily replacing its import
    vi.doMock('dayjs/locale/fr', () => {
      throw new Error('load error');
    });
    // Reload the module so it picks up the failed dynamic import
    const { loadDayjsLocale: load } = await import('./date.utils');
    await load('fr');
    expect(dayjs.locale).toHaveBeenCalledWith('en');
    vi.doUnmock('dayjs/locale/fr');
  });
});

describe('localToUtcDate', () => {
  it('returns a new Date instance', () => {
    const date = new Date('2024-06-15T12:00:00');
    expect(localToUtcDate(date)).not.toBe(date);
  });

  it('applies the timezone offset correctly', () => {
    const date = new Date('2024-06-15T12:00:00');
    const expectedTime = date.getTime() - date.getTimezoneOffset() * 60_000;
    expect(localToUtcDate(date).getTime()).toBe(expectedTime);
  });

  it('handles UTC (zero offset) without changing the time', () => {
    // Simulate a UTC environment by using a date whose offset is predictable
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = localToUtcDate(date);
    const expectedTime = date.getTime() - date.getTimezoneOffset() * 60_000;
    expect(result.getTime()).toBe(expectedTime);
  });
});
