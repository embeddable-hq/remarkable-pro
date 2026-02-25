import { Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import { TableHeaderAlign } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { DisplayFormatTypeOptions } from '../../types/DisplayFormat.type.emb';
import {
  getTableHeaderAlign,
  getTableHeaderMinWidth,
  getTableHeaders,
  getTableRows,
} from './tables.utils';
import type { Theme } from '../../../theme/theme.types';

vi.mock('../../../theme/formatter/formatter.utils');
vi.mock('@embeddable.com/remarkable-ui', () => ({
  TableHeaderAlign: { LEFT: 'left', CENTER: 'center', RIGHT: 'right' },
  getStyleNumber: vi.fn((_cssVar: string, fallback: string) => fallback),
}));

const makeDimOrMeas = (overrides: Partial<DimensionOrMeasure> = {}): DimensionOrMeasure =>
  ({
    name: 'col',
    title: 'Col',
    nativeType: 'string',
    inputs: {},
    ...overrides,
  }) as unknown as DimensionOrMeasure;

const makeTheme = (overrides: Partial<Theme['defaults']> = {}): Theme =>
  ({
    defaults: { tableCellStyleOptions: [], ...overrides },
    formatter: {},
  }) as unknown as Theme;

const makeFormatter = (overrides = {}) => ({
  dimensionOrMeasureTitle: vi.fn((d: DimensionOrMeasure) => d.title ?? d.name),
  data: vi.fn((_d: DimensionOrMeasure, value: unknown) => String(value ?? '')),
  ...overrides,
});

// ---------------------------------------------------------------------------

describe('getTableHeaderAlign', () => {
  it('returns subInputAlign when set', () => {
    const dim = makeDimOrMeas({ inputs: { align: 'center' } });
    expect(getTableHeaderAlign(dim)).toBe('center');
  });

  it('returns RIGHT for number nativeType', () => {
    expect(getTableHeaderAlign(makeDimOrMeas({ nativeType: 'number' }))).toBe(
      TableHeaderAlign.RIGHT,
    );
  });

  it('returns RIGHT for time nativeType', () => {
    expect(getTableHeaderAlign(makeDimOrMeas({ nativeType: 'time' }))).toBe(TableHeaderAlign.RIGHT);
  });

  it('returns RIGHT for boolean nativeType', () => {
    expect(getTableHeaderAlign(makeDimOrMeas({ nativeType: 'boolean' }))).toBe(
      TableHeaderAlign.RIGHT,
    );
  });

  it('returns LEFT for string nativeType', () => {
    expect(getTableHeaderAlign(makeDimOrMeas({ nativeType: 'string' }))).toBe(
      TableHeaderAlign.LEFT,
    );
  });
});

// ---------------------------------------------------------------------------

describe('getTableHeaderMinWidth', () => {
  it('returns subInputWidth when set', () => {
    const dim = makeDimOrMeas({ inputs: { width: '20rem' } });
    expect(getTableHeaderMinWidth(dim)).toBe('20rem');
  });

  it('uses CSS var fallback for string nativeType', () => {
    const result = getTableHeaderMinWidth(makeDimOrMeas({ nativeType: 'string' }));
    expect(result).toBe('8.75rem');
  });

  it('uses CSS var fallback for number nativeType', () => {
    const result = getTableHeaderMinWidth(makeDimOrMeas({ nativeType: 'number' }));
    expect(result).toBe('5.625rem');
  });

  it('uses CSS var fallback for time nativeType', () => {
    const result = getTableHeaderMinWidth(makeDimOrMeas({ nativeType: 'time' }));
    expect(result).toBe('8.75rem');
  });

  it('uses CSS var fallback for boolean nativeType', () => {
    const result = getTableHeaderMinWidth(makeDimOrMeas({ nativeType: 'boolean' }));
    expect(result).toBe('5.625rem');
  });
});

// ---------------------------------------------------------------------------

describe('getTableHeaders', () => {
  let formatter: ReturnType<typeof makeFormatter>;

  beforeEach(() => {
    formatter = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(formatter as never);
  });

  const theme = makeTheme();

  it('maps each dimOrMeas to a header with correct id, title, minWidth, align', () => {
    const dim = makeDimOrMeas({ name: 'revenue', title: 'Revenue', nativeType: 'number' });
    const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);

    expect(header?.id).toBe('revenue');
    expect(header?.title).toBe('Revenue');
    expect(header?.align).toBe(TableHeaderAlign.RIGHT);
    expect(header?.minWidth).toBe('5.625rem');
  });

  it('accessor injects displayNullAs into inputs and calls themeFormatter.data', () => {
    const dim = makeDimOrMeas({ name: 'city', nativeType: 'string' });
    const [header] = getTableHeaders({ dimensionsAndMeasures: [dim], displayNullAs: 'N/A' }, theme);

    const row = { city: 'Paris' };
    header?.accessor!(row);

    expect(formatter.data).toHaveBeenCalledWith(
      expect.objectContaining({ inputs: expect.objectContaining({ displayNullAs: 'N/A' }) }),
      'Paris',
    );
  });

  it('accessor passes value from row keyed by dimOrMeas.name', () => {
    const dim = makeDimOrMeas({ name: 'amount', nativeType: 'number' });
    const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);

    header?.accessor!({ amount: 42 });

    expect(formatter.data).toHaveBeenCalledWith(expect.anything(), 42);
  });

  describe('cellStyle', () => {
    it('returns undefined when no tableCellStyle input', () => {
      const dim = makeDimOrMeas({ inputs: {} });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);
      expect(header?.cellStyle!({ value: null })).toBeUndefined();
    });

    it('returns undefined when tableCellStyle value not found in theme options', () => {
      const dim = makeDimOrMeas({ inputs: { tableCellStyle: 'Bold' } });
      const themeWithOptions = makeTheme({ tableCellStyleOptions: [] });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, themeWithOptions);
      expect(header?.cellStyle!({ value: null })).toBeUndefined();
    });

    it('calls matching tableCellStyle option and returns its styles', () => {
      const stylesFn = vi.fn().mockReturnValue({ fontWeight: 'bold' });
      const dim = makeDimOrMeas({ inputs: { tableCellStyle: 'Bold' } });
      const themeWithOptions = makeTheme({
        tableCellStyleOptions: [{ value: 'Bold', styles: stylesFn }],
      });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, themeWithOptions);

      const result = header?.cellStyle!({ value: 5 });

      expect(stylesFn).toHaveBeenCalledWith({ value: 5 });
      expect(result).toEqual({ fontWeight: 'bold' });
    });
  });

  describe('cell', () => {
    it('is undefined when displayFormat is not JSON or Markdown', () => {
      const dim = makeDimOrMeas({ inputs: {} });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);
      expect(header?.cell).toBeUndefined();
    });

    it('is defined when displayFormat is JSON', () => {
      const dim = makeDimOrMeas({
        inputs: { displayFormat: DisplayFormatTypeOptions.JSON },
      });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);
      expect(header?.cell).toBeDefined();
    });

    it('is defined when displayFormat is MARKDOWN', () => {
      const dim = makeDimOrMeas({
        inputs: { displayFormat: DisplayFormatTypeOptions.MARKDOWN },
      });
      const [header] = getTableHeaders({ dimensionsAndMeasures: [dim] }, theme);
      expect(header?.cell).toBeDefined();
    });
  });

  it('returns one header per dimOrMeas', () => {
    const dims = [
      makeDimOrMeas({ name: 'a' }),
      makeDimOrMeas({ name: 'b' }),
      makeDimOrMeas({ name: 'c' }),
    ];
    const headers = getTableHeaders({ dimensionsAndMeasures: dims }, theme);
    expect(headers).toHaveLength(3);
    expect(headers.map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------

describe('getTableRows', () => {
  it('returns empty array when rows is undefined', () => {
    expect(getTableRows({ rows: undefined })).toEqual([]);
  });

  it('returns empty array when rows is empty', () => {
    expect(getTableRows({ rows: [] })).toEqual([]);
  });

  it('returns rows as-is when no clickDimension', () => {
    const rows = [{ city: 'Paris' }, { city: 'London' }];
    expect(getTableRows({ rows })).toBe(rows);
  });

  it('returns rows as-is when clickDimension key exists in data', () => {
    const dim = { name: 'city' } as Dimension;
    const rows = [{ city: 'Paris', revenue: 100 }];
    expect(getTableRows({ clickDimension: dim, rows })).toBe(rows);
  });

  it('removes clickDimension key from rows when it is not in the data columns', () => {
    const dim = { name: 'hidden' } as Dimension;
    const rows = [{ city: 'Paris', revenue: 100 }];
    const result = getTableRows({ clickDimension: dim, rows });
    expect(result).toEqual([{ city: 'Paris', revenue: 100 }]);
  });

  it('does not mutate original rows when removing clickDimension', () => {
    const dim = { name: 'id' } as Dimension;
    const rows = [{ city: 'Paris', id: 1 }];
    // id IS in the data, so rows returned as-is
    const result = getTableRows({ clickDimension: dim, rows });
    expect(result).toBe(rows);
  });
});
