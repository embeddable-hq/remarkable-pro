import { getComparisonPeriodDateRange, getComparisonPeriodLabel } from './timeRange.utils';
import { resolveI18nString } from '../component.utils';
import type { Theme } from '../../theme/theme.types';
import type { TimeRange } from '@embeddable.com/core';

vi.mock('../component.utils', () => ({ resolveI18nString: vi.fn() }));

const range = (from: Date, to: Date): TimeRange => ({ from, to, relativeTimeString: '' });

const makeTheme = (
  dateRangesOptions: Theme['defaults']['dateRangesOptions'] = [],
  comparisonPeriodsOptions: Theme['defaults']['comparisonPeriodsOptions'] = [],
): Theme => ({ defaults: { dateRangesOptions, comparisonPeriodsOptions } }) as unknown as Theme;

// ---------------------------------------------------------------------------

describe('getComparisonPeriodDateRange', () => {
  describe('guard clauses', () => {
    it('returns undefined when primaryDateRange is undefined', () => {
      expect(
        getComparisonPeriodDateRange(undefined, 'Previous period', makeTheme()),
      ).toBeUndefined();
    });

    it('returns undefined when comparisonPeriod is undefined', () => {
      const dr = range(new Date('2024-01-01'), new Date('2024-01-31'));
      expect(getComparisonPeriodDateRange(dr, undefined, makeTheme())).toBeUndefined();
    });

    it('returns undefined when comparisonPeriod is not found in options', () => {
      const dr = range(new Date('2024-03-01'), new Date('2024-03-31'));
      expect(getComparisonPeriodDateRange(dr, 'Unknown period', makeTheme())).toBeUndefined();
    });
  });

  describe('when primaryDateRange has no relativeTimeString', () => {
    it('passes primaryDateRange directly to getRange', () => {
      const dr = range(new Date('2024-03-01T00:00:00.000Z'), new Date('2024-03-31T23:59:59.999Z'));
      const expected = range(
        new Date('2024-02-01T00:00:00.000Z'),
        new Date('2024-02-29T23:59:59.999Z'),
      );
      const getRange = vi.fn().mockReturnValue(expected);
      const theme = makeTheme(
        [],
        [
          {
            value: 'Previous month',
            label: 'key|Previous month',
            dateFormat: 'MMM YYYY',
            getRange,
          },
        ],
      );

      const result = getComparisonPeriodDateRange(dr, 'Previous month', theme);

      expect(getRange).toHaveBeenCalledWith(dr);
      expect(result).toBe(expected);
    });
  });

  describe('when primaryDateRange has a relativeTimeString', () => {
    it('resolves the date range via dateRangesOptions and passes it to getRange', () => {
      const resolvedRange = range(
        new Date('2024-03-01T00:00:00.000Z'),
        new Date('2024-03-31T23:59:59.999Z'),
      );
      const dr: TimeRange = { from: undefined, to: undefined, relativeTimeString: 'This month' };
      const getDateRange = vi.fn().mockReturnValue(resolvedRange);
      const getRange = vi.fn().mockReturnValue(undefined);
      const theme = makeTheme(
        [
          {
            value: 'This month',
            label: 'key|This month',
            dateFormat: 'MMM YYYY',
            getRange: getDateRange,
          },
        ],
        [
          {
            value: 'Previous month',
            label: 'key|Previous month',
            dateFormat: 'MMM YYYY',
            getRange,
          },
        ],
      );

      getComparisonPeriodDateRange(dr, 'Previous month', theme);

      expect(getDateRange).toHaveBeenCalled();
      expect(getRange).toHaveBeenCalledWith(resolvedRange);
    });

    it('passes undefined to getRange when relativeTimeString is not found in dateRangesOptions', () => {
      const dr: TimeRange = { from: undefined, to: undefined, relativeTimeString: 'Unknown range' };
      const getRange = vi.fn().mockReturnValue(undefined);
      const theme = makeTheme(
        [],
        [
          {
            value: 'Previous month',
            label: 'key|Previous month',
            dateFormat: 'MMM YYYY',
            getRange,
          },
        ],
      );

      getComparisonPeriodDateRange(dr, 'Previous month', theme);

      expect(getRange).toHaveBeenCalledWith(undefined);
    });
  });
});

// ---------------------------------------------------------------------------

describe('getComparisonPeriodLabel', () => {
  beforeEach(() => {
    vi.mocked(resolveI18nString).mockReset();
  });

  it('returns empty string when comparisonPeriod is undefined', () => {
    expect(getComparisonPeriodLabel(undefined, makeTheme())).toBe('');
  });

  it('returns empty string when comparisonPeriod is not found in options', () => {
    expect(getComparisonPeriodLabel('Unknown period', makeTheme())).toBe('');
  });

  it('calls resolveI18nString with the option label and returns the result', () => {
    vi.mocked(resolveI18nString).mockReturnValue('Previous month');
    const theme = makeTheme(
      [],
      [
        {
          value: 'Previous month',
          label: 'key|Previous month',
          dateFormat: 'MMM YYYY',
          getRange: vi.fn(),
        },
      ],
    );

    const result = getComparisonPeriodLabel('Previous month', theme);

    expect(resolveI18nString).toHaveBeenCalledWith('key|Previous month');
    expect(result).toBe('Previous month');
  });
});
