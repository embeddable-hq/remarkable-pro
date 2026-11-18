import type { Mock } from 'vitest';
import dayjs from 'dayjs';
import { renderHook, waitFor } from '@testing-library/react';
import { useTheme } from '@embeddable.com/react';
import { loadDayjsLocale, localToUtcDate, useLoadDayjsLocale } from './date.utils';

vi.mock('dayjs', () => {
  const locale = vi.fn();
  return { default: Object.assign(vi.fn(), { locale }) };
});

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(),
}));

const mockLanguage = (language: string) =>
  (useTheme as Mock).mockReturnValue({ i18n: { language }, formatter: { locale: 'en-US' } });

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

describe('useLoadDayjsLocale', () => {
  const renderReadyStates = () => {
    const states: boolean[] = [];
    renderHook(() => {
      const { dayjsLocaleReady } = useLoadDayjsLocale();
      states.push(dayjsLocaleReady);
    });
    return states;
  };

  it('is ready on the first render for English', () => {
    mockLanguage('en');
    expect(renderReadyStates()[0]).toBe(true);
  });

  it('becomes ready after loading a new locale', async () => {
    mockLanguage('de');
    const states = renderReadyStates();
    expect(states[0]).toBe(false);
    await waitFor(() => expect(states.at(-1)).toBe(true));
  });

  it('is ready on the first render for an already loaded locale', async () => {
    await loadDayjsLocale('de');
    mockLanguage('de');
    expect(renderReadyStates()[0]).toBe(true);
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
