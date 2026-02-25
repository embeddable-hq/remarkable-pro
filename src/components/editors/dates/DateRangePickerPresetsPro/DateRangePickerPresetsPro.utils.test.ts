import { getDateRangeSelectFieldProOptions } from './DateRangePickerPresetsPro.utils';
import { resolveI18nString } from '../../../component.utils';
import { getTimeRangeLabel } from '../dates.utils';
import type { DateRangeSelectFieldProOption } from './DateRangePickerPresetsPro.types';
import type { TimeRange } from '@embeddable.com/core';

vi.mock('../../../component.utils', () => ({ resolveI18nString: vi.fn() }));
vi.mock('../dates.utils', () => ({ getTimeRangeLabel: vi.fn() }));

const range = (from: Date, to: Date): TimeRange => ({ from, to, relativeTimeString: '' });

const makeOption = (value: string, label: string): DateRangeSelectFieldProOption => ({
  value,
  label,
  dateFormat: 'MMM YYYY',
  getRange: vi.fn().mockReturnValue(range(new Date('2024-01-01'), new Date('2024-01-31'))),
});

// ---------------------------------------------------------------------------

describe('getDateRangeSelectFieldProOptions', () => {
  beforeEach(() => {
    vi.mocked(resolveI18nString).mockReset();
    vi.mocked(getTimeRangeLabel).mockReset();
  });

  it('maps each option to a SelectListOptionProps shape', () => {
    const opt = makeOption('last_7_days', 'key|Last 7 days');
    vi.mocked(resolveI18nString).mockReturnValue('Last 7 days');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    const result = getDateRangeSelectFieldProOptions([opt]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      value: 'last_7_days',
      label: 'Last 7 days',
      rightLabel: 'Jan 2024',
    });
  });

  it('calls getTimeRangeLabel with the result of getRange and option.dateFormat', () => {
    const returned = range(new Date('2024-01-01'), new Date('2024-01-31'));
    const opt = makeOption('last_7_days', 'key|Last 7 days');
    vi.mocked(opt.getRange).mockReturnValue(returned);
    vi.mocked(resolveI18nString).mockReturnValue('Last 7 days');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    getDateRangeSelectFieldProOptions([opt]);

    expect(getTimeRangeLabel).toHaveBeenCalledWith(returned, 'MMM YYYY');
  });

  it('calls resolveI18nString with option.label', () => {
    const opt = makeOption('last_7_days', 'key|Last 7 days');
    vi.mocked(resolveI18nString).mockReturnValue('Last 7 days');
    vi.mocked(getTimeRangeLabel).mockReturnValue('Jan 2024');

    getDateRangeSelectFieldProOptions([opt]);

    expect(resolveI18nString).toHaveBeenCalledWith('key|Last 7 days');
  });

  it('handles multiple options', () => {
    const opts = [
      makeOption('last_7_days', 'key|Last 7 days'),
      makeOption('last_30_days', 'key|Last 30 days'),
    ];
    vi.mocked(resolveI18nString)
      .mockReturnValueOnce('Last 7 days')
      .mockReturnValueOnce('Last 30 days');
    vi.mocked(getTimeRangeLabel).mockReturnValueOnce('Jan 2024').mockReturnValueOnce('Dec 2023');

    const result = getDateRangeSelectFieldProOptions(opts);

    expect(result).toHaveLength(2);
    expect(result[0]?.value).toBe('last_7_days');
    expect(result[1]?.value).toBe('last_30_days');
  });

  it('returns an empty array when options array is empty', () => {
    const result = getDateRangeSelectFieldProOptions([]);

    expect(result).toEqual([]);
  });
});
