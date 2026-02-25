import { defaultDateRangeOptions } from './defaults.DateRanges.constants';

// Fixed reference point: Thursday 2024-02-15 at noon UTC
const FIXED_NOW = new Date('2024-02-15T12:00:00.000Z');

describe('defaultDateRangeOptions', () => {
  it('has 22 options', () => {
    expect(defaultDateRangeOptions).toHaveLength(22);
  });

  it('each option has value, label, dateFormat, and getRange function', () => {
    for (const option of defaultDateRangeOptions) {
      expect(typeof option.value).toBe('string');
      expect(typeof option.label).toBe('string');
      expect(typeof option.dateFormat).toBe('string');
      expect(typeof option.getRange).toBe('function');
    }
  });

  describe('getRange() with fixed date (2024-02-15T12:00:00Z — a Thursday)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const getOption = (value: string) => {
      const opt = defaultDateRangeOptions.find((o) => o.value === value);
      if (!opt) throw new Error(`Option "${value}" not found`);
      return opt;
    };

    it('Today', () => {
      const { from, to } = getOption('Today').getRange();
      expect(from).toEqual(new Date('2024-02-15T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Yesterday', () => {
      const { from, to } = getOption('Yesterday').getRange();
      expect(from).toEqual(new Date('2024-02-14T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-14T23:59:59.999Z'));
    });

    it('This week (ISO week: Mon–Sun)', () => {
      const { from, to } = getOption('This week').getRange();
      expect(from).toEqual(new Date('2024-02-12T00:00:00.000Z')); // Monday
      expect(to).toEqual(new Date('2024-02-18T23:59:59.999Z')); // Sunday
    });

    it('Last week', () => {
      const { from, to } = getOption('Last week').getRange();
      expect(from).toEqual(new Date('2024-02-05T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-11T23:59:59.999Z'));
    });

    it('Week to date', () => {
      const { from, to } = getOption('Week to date').getRange();
      expect(from).toEqual(new Date('2024-02-12T00:00:00.000Z')); // Monday
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Last 7 days', () => {
      const { from, to } = getOption('Last 7 days').getRange();
      expect(from).toEqual(new Date('2024-02-09T00:00:00.000Z')); // now - 6 days
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Next 7 days', () => {
      const { from, to } = getOption('Next 7 days').getRange();
      expect(from).toEqual(new Date('2024-02-15T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-21T23:59:59.999Z')); // now + 6 days
    });

    it('Last 30 days', () => {
      const { from, to } = getOption('Last 30 days').getRange();
      expect(from).toEqual(new Date('2024-01-17T00:00:00.000Z')); // now - 29 days
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Next 30 days', () => {
      const { from, to } = getOption('Next 30 days').getRange();
      expect(from).toEqual(new Date('2024-02-15T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-03-15T23:59:59.999Z')); // now + 29 days
    });

    it('This month (Feb 2024, leap year)', () => {
      const { from, to } = getOption('This month').getRange();
      expect(from).toEqual(new Date('2024-02-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-29T23:59:59.999Z'));
    });

    it('Last month (Jan 2024)', () => {
      const { from, to } = getOption('Last month').getRange();
      expect(from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('Next month (Mar 2024)', () => {
      const { from, to } = getOption('Next month').getRange();
      expect(from).toEqual(new Date('2024-03-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('This quarter (Q1 2024)', () => {
      const { from, to } = getOption('This quarter').getRange();
      expect(from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('Last quarter (Q4 2023)', () => {
      const { from, to } = getOption('Last quarter').getRange();
      expect(from).toEqual(new Date('2023-10-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2023-12-31T23:59:59.999Z'));
    });

    it('Next quarter (Q2 2024)', () => {
      const { from, to } = getOption('Next quarter').getRange();
      expect(from).toEqual(new Date('2024-04-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-06-30T23:59:59.999Z'));
    });

    it('Quarter to date', () => {
      const { from, to } = getOption('Quarter to date').getRange();
      expect(from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Last 6 months', () => {
      const { from, to } = getOption('Last 6 months').getRange();
      expect(from).toEqual(new Date('2023-08-15T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('Last 12 months', () => {
      const { from, to } = getOption('Last 12 months').getRange();
      expect(from).toEqual(new Date('2023-02-15T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });

    it('This year (2024)', () => {
      const { from, to } = getOption('This year').getRange();
      expect(from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-12-31T23:59:59.999Z'));
    });

    it('Last year (2023)', () => {
      const { from, to } = getOption('Last year').getRange();
      expect(from).toEqual(new Date('2023-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2023-12-31T23:59:59.999Z'));
    });

    it('Next year (2025)', () => {
      const { from, to } = getOption('Next year').getRange();
      expect(from).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2025-12-31T23:59:59.999Z'));
    });

    it('Year to date', () => {
      const { from, to } = getOption('Year to date').getRange();
      expect(from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(to).toEqual(new Date('2024-02-15T23:59:59.999Z'));
    });
  });
});
