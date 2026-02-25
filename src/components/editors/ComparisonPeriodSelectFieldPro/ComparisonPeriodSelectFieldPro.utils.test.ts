import {
  isComparisonPeriodAvailable,
  getComparisonPeriodSelectFieldProOptions,
} from './ComparisonPeriodSelectFieldPro.utils';
import { resolveI18nString } from '../../component.utils';
import { getTimeRangeLabel } from '../dates/dates.utils';
import type { ComparisonPeriodSelectFieldProOption } from './ComparisonPeriodSelectFieldPro.types';
import type { TimeRange } from '@embeddable.com/core';

vi.mock('../../component.utils', () => ({ resolveI18nString: vi.fn() }));
vi.mock('../dates/dates.utils', () => ({ getTimeRangeLabel: vi.fn() }));

const range = (from: Date, to: Date): TimeRange => ({ from, to, relativeTimeString: '' });

const makeOption = (value: string, label: string): ComparisonPeriodSelectFieldProOption => ({
  value,
  label,
  dateFormat: 'MMM YYYY',
  getRange: vi.fn().mockReturnValue(range(new Date('2024-01-01'), new Date('2024-01-31'))),
});

// ---------------------------------------------------------------------------

describe('isComparisonPeriodAvailable', () => {
  const options = [
    makeOption('previous_period', 'Previous period'),
    makeOption('previous_year', 'Previous year'),
  ];

  it('returns true when option is undefined', () => {
    expect(isComparisonPeriodAvailable(undefined, options)).toBe(true);
  });

  it('returns true when option value exists in the list', () => {
    expect(isComparisonPeriodAvailable('previous_period', options)).toBe(true);
  });

  it('returns false when option value does not exist in the list', () => {
    expect(isComparisonPeriodAvailable('unknown_period', options)).toBe(false);
  });

  it('returns true for empty string option (falsy, treated like undefined)', () => {
    expect(isComparisonPeriodAvailable('', options)).toBe(true);
  });

  it('returns false when options array is empty', () => {
    expect(isComparisonPeriodAvailable('previous_period', [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('getComparisonPeriodSelectFieldProOptions', () => {
  const toCompareTimeRange = range(new Date('2024-03-01'), new Date('2024-03-31'));

  beforeEach(() => {
    vi.mocked(resolveI18nString).mockReset();
    vi.mocked(getTimeRangeLabel).mockReset();
  });

  it('maps each option to a SelectListOptionProps shape', () => {
    const opt = makeOption('previous_period', 'key|Previous period');
    vi.mocked(resolveI18nString).mockReturnValue('Previous period');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    const result = getComparisonPeriodSelectFieldProOptions([opt], toCompareTimeRange);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      value: 'previous_period',
      label: 'Previous period',
      rightLabel: 'Jan 2024',
    });
  });

  it('calls getRange with toCompareTimeRange', () => {
    const opt = makeOption('previous_period', 'key|Previous period');
    vi.mocked(resolveI18nString).mockReturnValue('Previous period');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    getComparisonPeriodSelectFieldProOptions([opt], toCompareTimeRange);

    expect(opt.getRange).toHaveBeenCalledWith(toCompareTimeRange);
  });

  it('calls getTimeRangeLabel with the result of getRange and option.dateFormat', () => {
    const returned = range(new Date('2024-01-01'), new Date('2024-01-31'));
    const opt = makeOption('previous_period', 'key|Previous period');
    vi.mocked(opt.getRange).mockReturnValue(returned);
    vi.mocked(resolveI18nString).mockReturnValue('Previous period');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    getComparisonPeriodSelectFieldProOptions([opt], toCompareTimeRange);

    expect(getTimeRangeLabel).toHaveBeenCalledWith(returned, 'MMM YYYY');
  });

  it('calls resolveI18nString with option.label', () => {
    const opt = makeOption('previous_period', 'key|Previous period');
    vi.mocked(resolveI18nString).mockReturnValue('Previous period');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    getComparisonPeriodSelectFieldProOptions([opt], toCompareTimeRange);

    expect(resolveI18nString).toHaveBeenCalledWith('key|Previous period');
  });

  it('sets rightLabel to empty string when toCompareTimeRange is falsy', () => {
    const opt = makeOption('previous_period', 'key|Previous period');
    vi.mocked(resolveI18nString).mockReturnValue('Previous period');

    const result = getComparisonPeriodSelectFieldProOptions(
      [opt],
      undefined as unknown as TimeRange,
    );

    expect(result[0]?.rightLabel).toBe('');
    expect(opt.getRange).not.toHaveBeenCalled();
    expect(getTimeRangeLabel).not.toHaveBeenCalled();
  });

  it('handles multiple options', () => {
    const opts = [
      makeOption('previous_period', 'key|Previous period'),
      makeOption('previous_year', 'key|Previous year'),
    ];
    vi.mocked(resolveI18nString)
      .mockReturnValueOnce('Previous period')
      .mockReturnValueOnce('Previous year');
    vi.mocked(getTimeRangeLabel).mockReturnValueOnce('Jan 2024').mockReturnValueOnce('Mar 2023');

    const result = getComparisonPeriodSelectFieldProOptions(opts, toCompareTimeRange);

    expect(result).toHaveLength(2);
    expect(result[0]?.value).toBe('previous_period');
    expect(result[1]?.value).toBe('previous_year');
  });

  it('returns an empty array when options array is empty', () => {
    const result = getComparisonPeriodSelectFieldProOptions([], toCompareTimeRange);

    expect(result).toEqual([]);
  });
});
