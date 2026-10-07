import type { Dimension, Measure } from '@embeddable.com/core';
import type { Mock } from 'vitest';
import * as XLSX from 'xlsx';
import domtoimage from 'dom-to-image-more';
import { exportCSV, exportPNG, exportXLSX } from './export.utils';
import { getThemeFormatter } from '../formatter/formatter.utils';
import type { Theme } from '../theme.types';

// ─── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('../formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock('dom-to-image-more', () => ({ default: { toPng: vi.fn() } }));

// ─── Shared helpers ───────────────────────────────────────────────────────────
const mockTheme = {} as Theme;

const mockFormatter = {
  dimensionOrMeasureTitle: vi.fn((dm: Dimension) => dm.title ?? dm.name),
  data: vi.fn((_dm: Dimension, val: unknown) => (val == null ? '' : String(val))),
};

/** Creates a minimal Dimension stub */
const dim = (name: string, title = name, nativeType = 'string') =>
  ({ name, title, nativeType, __type__: 'dimension' }) as unknown as Dimension;

/** Creates a minimal Measure stub */
const measure = (name: string, title = name, nativeType = 'number') =>
  ({ name, title, nativeType, __type__: 'measure' }) as unknown as Measure;

// ─── exportCSV ────────────────────────────────────────────────────────────────
describe('exportCSV', () => {
  let createObjectURL: Mock;
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (getThemeFormatter as Mock).mockReturnValue(mockFormatter);
    mockFormatter.dimensionOrMeasureTitle.mockImplementation(
      (dm: Dimension) => dm.title ?? dm.name,
    );
    mockFormatter.data.mockImplementation((_: Dimension, val: unknown) =>
      val == null ? '' : String(val),
    );

    createObjectURL = vi.fn(() => 'blob:csv-url');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    appendSpy = vi.spyOn(document.body, 'appendChild');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('triggers a download click', () => {
    exportCSV({ title: 'Report', data: [], dimensionsAndMeasures: [], theme: mockTheme });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('sets the correct download filename', () => {
    exportCSV({ title: 'Sales', data: [], dimensionsAndMeasures: [], theme: mockTheme });
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('Sales.csv');
  });

  it('falls back to "untitled.csv" when no title is given', () => {
    exportCSV({ data: [], dimensionsAndMeasures: [], theme: mockTheme });
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('untitled.csv');
  });

  it('passes a Blob to URL.createObjectURL', () => {
    exportCSV({ title: 'Report', data: [], dimensionsAndMeasures: [], theme: mockTheme });
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('builds correct CSV content with headers and rows', async () => {
    const dims = [dim('city', 'City'), measure('revenue', 'Revenue')];
    const rows = [
      { city: 'London', revenue: '1000' },
      { city: 'Paris', revenue: null },
    ];

    exportCSV({ title: 'test', data: rows, dimensionsAndMeasures: dims, theme: mockTheme });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('City,Revenue\r\nLondon,1000\r\nParis,');
  });

  it('escapes inner double quotes in cell values', async () => {
    exportCSV({
      title: 'test',
      data: [{ name: 'He said "hello"' }],
      dimensionsAndMeasures: [dim('name', 'Name')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('Name\r\n"He said ""hello"""');
  });

  it('keeps blank, non-finite and unsafe-integer numeric values as the original string', async () => {
    exportCSV({
      title: 'test',
      data: [{ n: '   ' }, { n: 'Infinity' }, { n: '12345678901234567890' }],
      dimensionsAndMeasures: [measure('n', 'N')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('N\r\n"   "\r\nInfinity\r\n12345678901234567890');
  });

  it('escapes null values as empty strings', async () => {
    exportCSV({
      title: 'test',
      data: [{ value: null }],
      dimensionsAndMeasures: [dim('value', 'Value')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('Value\r\n');
  });

  it('quotes cells containing commas, newlines or surrounding whitespace', async () => {
    exportCSV({
      title: 'test',
      data: [{ a: 'x, y' }, { a: 'line1\nline2' }, { a: ' padded' }],
      dimensionsAndMeasures: [dim('a', 'A')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('A\r\n"x, y"\r\n"line1\nline2"\r\n" padded"');
  });

  it('leaves numeric measures unquoted and keeps text dimensions as-is', async () => {
    exportCSV({
      title: 'test',
      data: [{ zip: '01234', total: '12.5' }],
      dimensionsAndMeasures: [dim('zip', 'Zip'), measure('total', 'Total', 'sum')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('Zip,Total\r\n01234,12.5');
  });
});

// ─── exportXLSX ───────────────────────────────────────────────────────────────
describe('exportXLSX', () => {
  beforeEach(() => {
    (getThemeFormatter as Mock).mockReturnValue(mockFormatter);
    mockFormatter.dimensionOrMeasureTitle.mockImplementation(
      (dm: Dimension) => dm.title ?? dm.name,
    );
    mockFormatter.data.mockImplementation((_: Dimension, val: unknown) =>
      val == null ? '' : String(val),
    );
  });

  afterEach(() => vi.clearAllMocks());

  it('passes the formatted 2D array to aoa_to_sheet', () => {
    exportXLSX({
      title: 'test',
      data: [{ city: 'London' }],
      dimensionsAndMeasures: [dim('city', 'City')],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([['City'], ['London']]);
  });

  it('coerces numeric measures and number dimensions to numbers', () => {
    exportXLSX({
      title: 'test',
      data: [{ city: 'London', zip: '01234', year: '2024', revenue: '1000.5', note: '7' }],
      dimensionsAndMeasures: [
        dim('city', 'City'),
        dim('zip', 'Zip'),
        dim('year', 'Year', 'number'),
        measure('revenue', 'Revenue', 'sum'),
        measure('note', 'Note', 'string'),
      ],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['City', 'Zip', 'Year', 'Revenue', 'Note'],
      ['London', '01234', 2024, 1000.5, '7'],
    ]);
  });

  it('falls back to the original string when a numeric value is not a number', () => {
    exportXLSX({
      title: 'test',
      data: [{ revenue: 'N/A' }, { revenue: null }, { revenue: '' }],
      dimensionsAndMeasures: [measure('revenue', 'Revenue')],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([['Revenue'], ['N/A'], [''], ['']]);
  });

  it('keeps blank, non-finite and unsafe-integer values as the original string', () => {
    exportXLSX({
      title: 'test',
      data: [
        { n: '   ' },
        { n: 'Infinity' },
        { n: '-Infinity' },
        { n: '12345678901234567890' },
        { n: '9007199254740991' },
        { n: '3.3333333333333335' },
      ],
      dimensionsAndMeasures: [measure('n', 'N')],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['N'],
      ['   '],
      ['Infinity'],
      ['-Infinity'],
      ['12345678901234567890'],
      [9007199254740991],
      [3.3333333333333335],
    ]);
  });

  it('calls writeFile with the correct filename', () => {
    exportXLSX({ title: 'MyReport', data: [], dimensionsAndMeasures: [], theme: mockTheme });
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'MyReport.xlsx');
  });

  it('falls back to "untitled.xlsx" when no title is given', () => {
    exportXLSX({ data: [], dimensionsAndMeasures: [], theme: mockTheme });
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'untitled.xlsx');
  });

  it('appends the worksheet to the workbook as "Sheet1"', () => {
    exportXLSX({ title: 'test', data: [], dimensionsAndMeasures: [], theme: mockTheme });
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Sheet1',
    );
  });
});

// ─── exportPNG ────────────────────────────────────────────────────────────────
describe('exportPNG', () => {
  let createObjectURL: Mock;
  let revokeObjectURL: Mock;
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:png-url');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
      }),
    );

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    appendSpy = vi.spyOn(document.body, 'appendChild');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws when containerRef.current is null', async () => {
    await expect(exportPNG({ containerRef: { current: null }, theme: mockTheme })).rejects.toThrow(
      'exportPNG: element is undefined',
    );
  });

  it('throws when containerRef is absent', async () => {
    await expect(exportPNG({ theme: mockTheme })).rejects.toThrow(
      'exportPNG: element is undefined',
    );
  });

  it('calls domtoimage.toPng with the container element', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    expect(domtoimage.toPng).toHaveBeenCalledWith(el, expect.objectContaining({ cacheBust: true }));
  });

  it('sets the correct download filename', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'MyChart', containerRef: { current: el }, theme: mockTheme });

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('MyChart.png');
  });

  it('falls back to "untitled.png" when no title', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ containerRef: { current: el }, theme: mockTheme });

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('untitled.png');
  });

  it('triggers a download click', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('revokes the object URL after download', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:png-url');
  });

  it('excludes elements marked with data-no-export', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    const callArgs = (domtoimage.toPng as Mock).mock.calls[0];
    const filter = callArgs && callArgs[1] ? callArgs[1].filter : undefined;

    const excluded = document.createElement('div');
    excluded.setAttribute('data-no-export', '');
    expect(filter(excluded)).toBe(false);

    expect(filter(document.createElement('span'))).toBe(true);
    expect(filter('not-an-element')).toBe(true);
  });

  it('re-throws domtoimage errors with a descriptive wrapper', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockRejectedValue(new Error('render failed'));

    await expect(
      exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme }),
    ).rejects.toThrow('exportPNG failed: render failed');
  });
});
