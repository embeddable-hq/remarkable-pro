import type { Dimension } from '@embeddable.com/core';
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
const dim = (name: string, title = name) =>
  ({ name, title, nativeType: 'string' }) as unknown as Dimension;

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
    const dims = [dim('city', 'City'), dim('revenue', 'Revenue')];
    const rows = [
      { city: 'London', revenue: '1000' },
      { city: 'Paris', revenue: null },
    ];

    exportCSV({ title: 'test', data: rows, dimensionsAndMeasures: dims, theme: mockTheme });

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await blob.text()).toBe('"City","Revenue"\r\n"London","1000"\r\n"Paris",""');
  });

  it('escapes inner double quotes in cell values', async () => {
    exportCSV({
      title: 'test',
      data: [{ name: 'He said "hello"' }],
      dimensionsAndMeasures: [dim('name', 'Name')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await blob.text()).toBe('"Name"\r\n"He said ""hello"""');
  });

  it('escapes null values as empty strings', async () => {
    exportCSV({
      title: 'test',
      data: [{ value: null }],
      dimensionsAndMeasures: [dim('value', 'Value')],
      theme: mockTheme,
    });

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await blob.text()).toBe('"Value"\r\n""');
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

    const { filter } = (domtoimage.toPng as Mock).mock.calls[0][1];

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
