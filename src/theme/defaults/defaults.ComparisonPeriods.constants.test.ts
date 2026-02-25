import { defaultComparisonPeriodOptions } from './defaults.ComparisonPeriods.constants';

const range = (from: Date, to: Date) => ({ from, to, relativeTimeString: '' });
const noRange = { relativeTimeString: '' };

const getOption = (value: string) => {
  const opt = defaultComparisonPeriodOptions.find((o) => o.value === value);
  if (!opt) throw new Error(`Option "${value}" not found`);
  return opt;
};

describe('defaultComparisonPeriodOptions', () => {
  it('has 9 options', () => {
    expect(defaultComparisonPeriodOptions).toHaveLength(9);
  });

  it('each option has required fields', () => {
    for (const option of defaultComparisonPeriodOptions) {
      expect(typeof option.value).toBe('string');
      expect(typeof option.label).toBe('string');
      expect(typeof option.dateFormat).toBe('string');
      expect(typeof option.getRange).toBe('function');
    }
  });

  describe('Previous period', () => {
    const opt = getOption('Previous period');

    it('returns previous 7-day range', () => {
      const input = range(
        new Date('2024-01-08T00:00:00.000Z'),
        new Date('2024-01-14T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-07T23:59:59.999Z'));
    });

    it('returns undefined when from/to are missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Previous week', () => {
    const opt = getOption('Previous week');

    it('returns the previous ISO week', () => {
      // 2024-01-08 is a Monday (week 2 of 2024)
      const input = range(
        new Date('2024-01-08T00:00:00.000Z'),
        new Date('2024-01-14T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-07T23:59:59.999Z'));
    });

    it('returns undefined when from is missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Previous month', () => {
    const opt = getOption('Previous month');

    it('returns the previous calendar month', () => {
      const input = range(
        new Date('2024-02-15T00:00:00.000Z'),
        new Date('2024-02-20T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('returns undefined when from is missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Previous quarter', () => {
    const opt = getOption('Previous quarter');

    it('returns the previous calendar quarter', () => {
      // from is in Q2 2024, previous is Q1 2024
      const input = range(
        new Date('2024-04-15T00:00:00.000Z'),
        new Date('2024-04-30T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('returns undefined when from is missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Previous year', () => {
    const opt = getOption('Previous year');

    it('returns the previous calendar year', () => {
      const input = range(
        new Date('2024-06-15T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2023-12-31T23:59:59.999Z'));
    });

    it('returns undefined when from is missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Same period last week', () => {
    const opt = getOption('Same period last week');

    it('shifts the range back by 7 days', () => {
      const input = range(
        new Date('2024-01-08T00:00:00.000Z'),
        new Date('2024-01-14T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-07T23:59:59.999Z'));
    });

    it('returns undefined when from/to are missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Same period last month', () => {
    const opt = getOption('Same period last month');

    it('shifts the range back by 1 month', () => {
      const input = range(
        new Date('2024-02-15T00:00:00.000Z'),
        new Date('2024-02-20T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-20T23:59:59.999Z'));
    });

    it('returns undefined when from/to are missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Same period last quarter', () => {
    const opt = getOption('Same period last quarter');

    it('shifts the range back by 1 quarter (3 months)', () => {
      const input = range(
        new Date('2024-04-15T00:00:00.000Z'),
        new Date('2024-04-20T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2024-01-20T23:59:59.999Z'));
    });

    it('returns undefined when from/to are missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });

  describe('Same period last year', () => {
    const opt = getOption('Same period last year');

    it('shifts the range back by 1 year', () => {
      const input = range(
        new Date('2024-06-15T00:00:00.000Z'),
        new Date('2024-06-20T23:59:59.999Z'),
      );
      const result = opt.getRange(input);
      expect(result?.from).toEqual(new Date('2023-06-15T00:00:00.000Z'));
      expect(result?.to).toEqual(new Date('2023-06-20T23:59:59.999Z'));
    });

    it('returns undefined when from/to are missing', () => {
      expect(opt.getRange(noRange)).toBeUndefined();
    });
  });
});
