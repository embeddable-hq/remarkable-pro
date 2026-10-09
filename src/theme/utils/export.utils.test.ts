import type { Dimension, Measure } from '@embeddable.com/core';
import type { Mock } from 'vitest';
import * as XLSX from 'xlsx';
import domtoimage from 'dom-to-image-more';
import { Chart } from 'chart.js';
import {
  exportCSV,
  exportPNG,
  exportXLSX,
  PNG_EXPORT_SCALE,
  stripInlineStyleFromClone,
} from './export.utils';
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

vi.mock('chart.js', () => ({ Chart: { getChart: vi.fn() } }));

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

  it('treats measures as numeric unless their type is string, time or boolean', () => {
    exportXLSX({
      title: 'test',
      data: [{ a: '1', b: '2', c: '3', d: '4', e: '5', f: '6' }],
      dimensionsAndMeasures: [
        measure('a', 'A', 'count_distinct_approx'),
        { name: 'b', title: 'B', __type__: 'measure' } as unknown as Measure, // no nativeType
        measure('c', 'C', 'string'),
        measure('d', 'D', 'time'),
        measure('e', 'E', 'boolean'),
        measure('f', 'F', 'sum'),
      ],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['A', 'B', 'C', 'D', 'E', 'F'],
      [1, 2, '3', '4', '5', 6],
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

  it('serializes object values instead of exporting "[object Object]"', () => {
    exportXLSX({
      title: 'test',
      data: [{ geo: { lat: 1, lng: 2 } }],
      dimensionsAndMeasures: [dim('geo', 'Geo')],
      theme: mockTheme,
    });
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([['Geo'], ['{"lat":1,"lng":2}']]);
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

  it('rasterizes at PNG_EXPORT_SCALE so the output is not limited to on-screen CSS pixels', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    expect(domtoimage.toPng).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ scale: PNG_EXPORT_SCALE }),
    );
  });

  it('exports the container, not the card, by default', async () => {
    const container = document.createElement('div');
    const card = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      containerRef: { current: container },
      cardRef: { current: card },
      theme: mockTheme,
    });

    expect((domtoimage.toPng as Mock).mock.lastCall![0]).toBe(container);
  });

  it('exports the card when options.captureFullCard is true', async () => {
    const container = document.createElement('div');
    const card = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      containerRef: { current: container },
      cardRef: { current: card },
      theme: mockTheme,
      options: { captureFullCard: true },
    });

    expect((domtoimage.toPng as Mock).mock.lastCall![0]).toBe(card);
  });

  it('falls back to the container when captureFullCard is set but there is no card', async () => {
    const container = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      containerRef: { current: container },
      theme: mockTheme,
      options: { captureFullCard: true },
    });

    expect((domtoimage.toPng as Mock).mock.lastCall![0]).toBe(container);
  });

  it('does not set a background color by default', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    expect((domtoimage.toPng as Mock).mock.lastCall![1]).not.toHaveProperty('bgcolor');
  });

  it('passes options.pngBackgroundColor to domtoimage as bgcolor', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      title: 'test',
      containerRef: { current: el },
      theme: mockTheme,
      options: { pngBackgroundColor: '#ffffff' },
    });

    expect(domtoimage.toPng).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ bgcolor: '#ffffff' }),
    );
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

  it('strips inline styles from cloned elements so computed styles win', async () => {
    const el = document.createElement('div');
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme });

    const callArgs = (domtoimage.toPng as Mock).mock.calls[0];
    const adjustClonedNode = callArgs && callArgs[1] ? callArgs[1].adjustClonedNode : undefined;
    expect(adjustClonedNode).toBe(stripInlineStyleFromClone);

    const original = document.createElement('div');
    original.setAttribute('style', 'display: flex; align-items: start;');
    const clone = original.cloneNode(false) as HTMLElement;
    adjustClonedNode(original, clone, false);

    expect(clone.hasAttribute('style')).toBe(false);
    expect(original.getAttribute('style')).toBe('display: flex; align-items: start;');
    expect(() => adjustClonedNode(original, document.createTextNode('x'), false)).not.toThrow();
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

// ─── exportPNG · Chart.js pixel ratio ────────────────────────────────────────
describe('exportPNG · Chart.js pixel ratio', () => {
  type FakeChart = {
    currentDevicePixelRatio: number;
    options: { devicePixelRatio?: number };
    resize: Mock;
    stop: Mock;
    calls: string[];
  };

  const fakeChart = (currentDevicePixelRatio: number): FakeChart => {
    const chart: FakeChart = {
      currentDevicePixelRatio,
      options: {},
      calls: [],
      stop: vi.fn(() => {
        chart.calls.push('stop');
      }),
      resize: vi.fn(() => {
        chart.calls.push('resize');
        chart.currentDevicePixelRatio = chart.options.devicePixelRatio ?? currentDevicePixelRatio;
      }),
    };
    return chart;
  };

  const containerWithCanvas = () => {
    const el = document.createElement('div');
    el.appendChild(document.createElement('canvas'));
    return el;
  };

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:png-url'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
      }),
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    (Chart.getChart as Mock).mockReset();
  });

  it('re-renders low-resolution charts at the export scale while rasterizing', async () => {
    const chart = fakeChart(1);
    (Chart.getChart as Mock).mockReturnValue(chart);

    let ratioDuringRender: number | undefined;
    (domtoimage.toPng as Mock).mockImplementation(async () => {
      ratioDuringRender = chart.currentDevicePixelRatio;
      return 'data:image/png;base64,abc';
    });

    await exportPNG({
      title: 'test',
      containerRef: { current: containerWithCanvas() },
      theme: mockTheme,
    });

    expect(ratioDuringRender).toBe(PNG_EXPORT_SCALE);
  });

  it('stops running animations before each resize so the redraw is synchronous', async () => {
    const chart = fakeChart(1);
    (Chart.getChart as Mock).mockReturnValue(chart);
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      title: 'test',
      containerRef: { current: containerWithCanvas() },
      theme: mockTheme,
    });

    expect(chart.calls).toEqual(['stop', 'resize', 'stop', 'resize']);
  });

  it('restores the original pixel ratio after the export', async () => {
    const chart = fakeChart(1);
    (Chart.getChart as Mock).mockReturnValue(chart);
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      title: 'test',
      containerRef: { current: containerWithCanvas() },
      theme: mockTheme,
    });

    expect(chart.options.devicePixelRatio).toBeUndefined();
    expect(chart.currentDevicePixelRatio).toBe(1);
    expect(chart.resize).toHaveBeenCalledTimes(2);
  });

  it('restores the original pixel ratio even when rasterizing fails', async () => {
    const chart = fakeChart(1);
    (Chart.getChart as Mock).mockReturnValue(chart);
    (domtoimage.toPng as Mock).mockRejectedValue(new Error('render failed'));

    await expect(
      exportPNG({
        title: 'test',
        containerRef: { current: containerWithCanvas() },
        theme: mockTheme,
      }),
    ).rejects.toThrow('exportPNG failed: render failed');

    expect(chart.options.devicePixelRatio).toBeUndefined();
    expect(chart.resize).toHaveBeenCalledTimes(2);
  });

  it('keeps restoring the remaining charts when one restore throws', async () => {
    const broken = fakeChart(1);
    const healthy = fakeChart(1);
    (Chart.getChart as Mock).mockReturnValueOnce(broken).mockReturnValueOnce(healthy);
    broken.resize
      .mockImplementationOnce(() => broken.calls.push('resize'))
      .mockImplementationOnce(() => {
        throw new Error('resize failed');
      });
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    const el = containerWithCanvas();
    el.appendChild(document.createElement('canvas'));

    await expect(
      exportPNG({ title: 'test', containerRef: { current: el }, theme: mockTheme }),
    ).resolves.toBeUndefined();

    expect(healthy.options.devicePixelRatio).toBeUndefined();
    expect(healthy.calls).toEqual(['stop', 'resize', 'stop', 'resize']);
  });

  it('leaves charts already rendered at or above the export scale untouched', async () => {
    const chart = fakeChart(PNG_EXPORT_SCALE);
    (Chart.getChart as Mock).mockReturnValue(chart);
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await exportPNG({
      title: 'test',
      containerRef: { current: containerWithCanvas() },
      theme: mockTheme,
    });

    expect(chart.resize).not.toHaveBeenCalled();
  });

  it('ignores canvases that are not Chart.js charts', async () => {
    (Chart.getChart as Mock).mockReturnValue(undefined);
    (domtoimage.toPng as Mock).mockResolvedValue('data:image/png;base64,abc');

    await expect(
      exportPNG({
        title: 'test',
        containerRef: { current: containerWithCanvas() },
        theme: mockTheme,
      }),
    ).resolves.toBeUndefined();
  });
});
