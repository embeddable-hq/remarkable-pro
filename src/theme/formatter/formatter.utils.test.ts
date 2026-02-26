import { getThemeFormatter } from './formatter.utils';
import { DisplayFormatTypeOptions } from '../../components/types/DisplayFormat.type.emb';
import { isValidISODate } from '../../utils/data.utils';
import { resolveI18nString } from '../../components/component.utils';

vi.mock('../../utils/data.utils', () => ({ isValidISODate: vi.fn() }));
vi.mock('../../components/component.utils', () => ({ resolveI18nString: vi.fn() }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dim = (overrides: Record<string, any> = {}) =>
  ({
    name: 'myField',
    title: 'My Field',
    nativeType: 'string',
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const createMockTheme = () => {
  const stringFormatFn = vi.fn((v: string) => `str:${v}`);
  const numberFormatFn = vi.fn((v: number | bigint) => `num:${v}`);
  const dateTimeFormatFn = vi.fn((v: Date) => `dt:${v.getTime()}`);
  const dataNumberFormatFn = vi.fn((v: number | bigint) => `dnum:${v}`);
  const dataDateTimeFormatFn = vi.fn((v: Date) => `ddt:${v.getTime()}`);
  const dataOthersFormatFn = vi.fn((v: string) => v);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const theme: any = {
    formatter: {
      stringFormatter: vi.fn(() => ({ format: stringFormatFn })),
      numberFormatter: vi.fn(() => ({ format: numberFormatFn })),
      dateTimeFormatter: vi.fn(() => ({ format: dateTimeFormatFn })),
      dataNumberFormatter: vi.fn(() => ({ format: dataNumberFormatFn })),
      dataDateTimeFormatter: vi.fn(() => ({ format: dataDateTimeFormatFn })),
      dataOthersFormatter: vi.fn(() => ({ format: dataOthersFormatFn })),
    },
  };

  return {
    theme,
    stringFormatFn,
    numberFormatFn,
    dateTimeFormatFn,
    dataNumberFormatFn,
    dataDateTimeFormatFn,
    dataOthersFormatFn,
  };
};

describe('getThemeFormatter', () => {
  describe('string', () => {
    it('delegates to stringFormatter', () => {
      const { theme, stringFormatFn } = createMockTheme();
      const fmt = getThemeFormatter(theme);

      const result = fmt.string('hello');

      expect(stringFormatFn).toHaveBeenCalledWith('hello');
      expect(result).toBe('str:hello');
    });
  });

  describe('number', () => {
    it('formats a number via numberFormatter', () => {
      const { theme, numberFormatFn } = createMockTheme();
      const fmt = getThemeFormatter(theme);

      const result = fmt.number(42);

      expect(numberFormatFn).toHaveBeenCalledWith(42);
      expect(result).toBe('num:42');
    });

    it('passes options to numberFormatter', () => {
      const { theme } = createMockTheme();
      const fmt = getThemeFormatter(theme);
      const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

      fmt.number(42, options);

      expect(theme.formatter.numberFormatter).toHaveBeenCalledWith(theme, options);
    });

    it('caches the formatter for the same options', () => {
      const { theme } = createMockTheme();
      const fmt = getThemeFormatter(theme);
      const options = { maximumFractionDigits: 2 };

      fmt.number(1, options);
      fmt.number(2, options);

      expect(theme.formatter.numberFormatter).toHaveBeenCalledTimes(1);
    });
  });

  describe('dateTime', () => {
    it('formats a date via dateTimeFormatter', () => {
      const { theme, dateTimeFormatFn } = createMockTheme();
      const fmt = getThemeFormatter(theme);
      const date = new Date('2024-01-15T10:30:00');

      const result = fmt.dateTime(date);

      expect(dateTimeFormatFn).toHaveBeenCalledWith(date);
      expect(result).toBe(`dt:${date.getTime()}`);
    });

    it('passes options to dateTimeFormatter', () => {
      const { theme } = createMockTheme();
      const fmt = getThemeFormatter(theme);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };

      fmt.dateTime(new Date(), options);

      expect(theme.formatter.dateTimeFormatter).toHaveBeenCalledWith(theme, options);
    });
  });

  describe('dimensionOrMeasureTitle', () => {
    it('uses resolveI18nString when displayName contains |', () => {
      const { theme } = createMockTheme();
      vi.mocked(resolveI18nString).mockReturnValue('Translated Name');
      const fmt = getThemeFormatter(theme);

      const result = fmt.dimensionOrMeasureTitle(dim({ inputs: { displayName: 'key|Fallback' } }));

      expect(resolveI18nString).toHaveBeenCalledWith('key|Fallback');
      expect(result).toBe('Translated Name');
    });

    it('returns displayName directly when no | present', () => {
      const { theme } = createMockTheme();
      const fmt = getThemeFormatter(theme);

      const result = fmt.dimensionOrMeasureTitle(dim({ inputs: { displayName: 'Custom Name' } }));

      expect(result).toBe('Custom Name');
    });

    it('returns title when formatter returns the name unchanged', () => {
      const { theme, dataOthersFormatFn } = createMockTheme();
      dataOthersFormatFn.mockImplementation((v: string) => v);
      const fmt = getThemeFormatter(theme);

      const result = fmt.dimensionOrMeasureTitle(dim({ name: 'myField', title: 'My Title' }));

      expect(result).toBe('My Title');
    });

    it('returns name when title is absent and formatter returns the name unchanged', () => {
      const { theme, dataOthersFormatFn } = createMockTheme();
      dataOthersFormatFn.mockImplementation((v: string) => v);
      const fmt = getThemeFormatter(theme);

      const result = fmt.dimensionOrMeasureTitle(dim({ name: 'myField', title: undefined }));

      expect(result).toBe('myField');
    });

    it('returns the formatted value when formatter transforms the name', () => {
      const { theme, dataOthersFormatFn } = createMockTheme();
      dataOthersFormatFn.mockReturnValue('Renamed Field');
      const fmt = getThemeFormatter(theme);

      const result = fmt.dimensionOrMeasureTitle(dim({ name: 'myField' }));

      expect(result).toBe('Renamed Field');
    });
  });

  describe('data', () => {
    describe('null/undefined values', () => {
      it('returns empty string for null when no displayNullAs set', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);

        expect(fmt.data(dim(), null)).toBe('');
      });

      it('returns empty string for undefined when no displayNullAs set', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);

        expect(fmt.data(dim(), undefined)).toBe('');
      });

      it('returns displayNullAs for null', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);

        expect(fmt.data(dim({ inputs: { displayNullAs: 'N/A' } }), null)).toBe('N/A');
      });
    });

    describe('displayFormat', () => {
      it('pretty-prints JSON when displayFormat is JSON', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);
        const value = { a: 1, b: 'hello' };

        const result = fmt.data(
          dim({ inputs: { displayFormat: DisplayFormatTypeOptions.JSON } }),
          value,
        );

        expect(result).toBe(JSON.stringify(value, null, 2));
      });

      it('returns value as-is when displayFormat is Markdown', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(
          dim({ inputs: { displayFormat: DisplayFormatTypeOptions.MARKDOWN } }),
          '**bold**',
        );

        expect(result).toBe('**bold**');
      });
    });

    describe('object values', () => {
      it('JSON stringifies objects without displayFormat', () => {
        const { theme } = createMockTheme();
        const fmt = getThemeFormatter(theme);
        const value = { x: 1 };

        expect(fmt.data(dim(), value)).toBe(JSON.stringify(value));
      });
    });

    describe('nativeType number', () => {
      it('formats number values via dataNumberFormatter', () => {
        const { theme, dataNumberFormatFn } = createMockTheme();
        dataNumberFormatFn.mockReturnValue('1,234');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'number' }), 1234);

        expect(dataNumberFormatFn).toHaveBeenCalledWith(1234);
        expect(result).toBe('1,234');
      });

      it('applies prefix and suffix to formatted number', () => {
        const { theme, dataNumberFormatFn } = createMockTheme();
        dataNumberFormatFn.mockReturnValue('100');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(
          dim({ nativeType: 'number', inputs: { prefix: '$', suffix: ' USD' } }),
          100,
        );

        expect(result).toBe('$100 USD');
      });
    });

    describe('nativeType time', () => {
      it('formats valid ISO date-time values via dataDateTimeFormatter', () => {
        const { theme, dataDateTimeFormatFn } = createMockTheme();
        vi.mocked(isValidISODate).mockReturnValue(true);
        dataDateTimeFormatFn.mockReturnValue('Jan 15, 2024');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'time' }), '2024-01-15T10:30:00.000');

        expect(result).toBe('Jan 15, 2024');
      });

      it('returns the raw value for invalid ISO date-time strings', () => {
        const { theme } = createMockTheme();
        vi.mocked(isValidISODate).mockReturnValue(false);
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'time' }), 'not-a-date');

        expect(result).toBe('not-a-date');
      });
    });

    describe('nativeType string and boolean', () => {
      it('applies dataOthersFormatter to string values', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('Formatted String');
        const fmt = getThemeFormatter(theme);

        expect(fmt.data(dim({ nativeType: 'string' }), 'raw')).toBe('Formatted String');
      });

      it('applies dataOthersFormatter to boolean values', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('Yes');
        const fmt = getThemeFormatter(theme);

        expect(fmt.data(dim({ nativeType: 'boolean' }), true)).toBe('Yes');
      });
    });

    describe('prefix and suffix', () => {
      it('prepends prefix to the formatted value', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('value');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'string', inputs: { prefix: '>> ' } }), 'value');

        expect(result).toBe('>> value');
      });

      it('appends suffix to the formatted value', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('value');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'string', inputs: { suffix: ' <<' } }), 'value');

        expect(result).toBe('value <<');
      });
    });

    describe('maxCharacters', () => {
      it('truncates with ellipsis when value exceeds maxCharacters', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('Hello World');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(
          dim({ nativeType: 'string', inputs: { maxCharacters: 5 } }),
          'Hello World',
        );

        expect(result).toBe('Hello...');
      });

      it('returns the full value when at or under maxCharacters', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('Hi');
        const fmt = getThemeFormatter(theme);

        const result = fmt.data(dim({ nativeType: 'string', inputs: { maxCharacters: 5 } }), 'Hi');

        expect(result).toBe('Hi');
      });

      it('includes prefix and suffix length in the character limit check', () => {
        const { theme, dataOthersFormatFn } = createMockTheme();
        dataOthersFormatFn.mockReturnValue('Hi');
        const fmt = getThemeFormatter(theme);

        // 'PREFIX_Hi_SUFFIX' = 16 chars, maxCharacters = 5 → truncates
        const result = fmt.data(
          dim({
            nativeType: 'string',
            inputs: { prefix: 'PREFIX_', suffix: '_SUFFIX', maxCharacters: 5 },
          }),
          'Hi',
        );

        expect(result).toBe('PREFI...');
      });
    });
  });
});
