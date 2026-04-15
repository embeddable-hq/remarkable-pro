import { getHeatMeasure, getHeatDimension } from './HeatMapPro.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

vi.mock('../../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

/* eslint-disable @typescript-eslint/no-explicit-any */

const makeFormatter = (overrides: Record<string, any> = {}) => ({
  dimensionOrMeasureTitle: vi.fn((d: any) => `title:${d.name}`),
  data: vi.fn((_d: any, v: any) => `fmt:${v}`),
  ...overrides,
});

const measure = (overrides: Record<string, any> = {}): any => ({
  name: 'myMeasure',
  title: 'My Measure',
  nativeType: 'number',
  ...overrides,
});

const dimension = (overrides: Record<string, any> = {}): any => ({
  name: 'myDim',
  title: 'My Dim',
  nativeType: 'string',
  ...overrides,
});

const mockTheme = {} as any;

beforeEach(() => {
  vi.mocked(getThemeFormatter).mockReset();
});

// ---------------------------------------------------------------------------

describe('getHeatMeasure', () => {
  it('returns key from measure name', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getHeatMeasure({ measure: measure() }, mockTheme);

    expect(result.key).toBe('myMeasure');
  });

  it('returns label from themeFormatter.dimensionOrMeasureTitle', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getHeatMeasure({ measure: measure() }, mockTheme);

    expect(result.label).toBe('title:myMeasure');
  });

  it('format delegates to themeFormatter.data when formatting is enabled', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const result = getHeatMeasure({ measure: measure() }, mockTheme);

    expect(result.format!(42)).toBe('fmt:42');
    expect(fmt.data).toHaveBeenCalledWith(expect.objectContaining({ name: 'myMeasure' }), 42);
  });

  it('format returns value.toString() when theme.disableFormatting.table.values is true', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);
    const theme = { disableFormatting: { table: { values: true } } } as any;

    const result = getHeatMeasure({ measure: measure() }, theme);

    expect(result.format!(42)).toBe('42');
    expect(fmt.data).not.toHaveBeenCalled();
  });

  it('format delegates to themeFormatter.data when theme.disableFormatting.table.values is false', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);
    const theme = { disableFormatting: { table: { values: false } } } as any;

    const result = getHeatMeasure({ measure: measure() }, theme);

    expect(result.format!(42)).toBe('fmt:42');
  });
});

// ---------------------------------------------------------------------------

describe('getHeatDimension', () => {
  it('returns key from dimension name', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getHeatDimension({ dimension: dimension() }, mockTheme);

    expect(result.key).toBe('myDim');
  });

  it('returns label from themeFormatter.dimensionOrMeasureTitle', () => {
    vi.mocked(getThemeFormatter).mockReturnValue(makeFormatter() as any);

    const result = getHeatDimension({ dimension: dimension() }, mockTheme);

    expect(result.label).toBe('title:myDim');
  });

  it('format delegates to themeFormatter.data', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const result = getHeatDimension({ dimension: dimension() }, mockTheme);

    expect(result.format!('raw-value')).toBe('fmt:raw-value');
    expect(fmt.data).toHaveBeenCalledWith(expect.objectContaining({ name: 'myDim' }), 'raw-value');
  });

  it('format returns raw value when disableFormatting is true', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const result = getHeatDimension({ dimension: dimension(), disableFormatting: true }, mockTheme);

    expect(result.format!('raw-value')).toBe('raw-value');
    expect(fmt.data).not.toHaveBeenCalled();
  });

  it('format delegates to themeFormatter.data when disableFormatting is false', () => {
    const fmt = makeFormatter();
    vi.mocked(getThemeFormatter).mockReturnValue(fmt as any);

    const result = getHeatDimension(
      { dimension: dimension(), disableFormatting: false },
      mockTheme,
    );

    expect(result.format!('raw-value')).toBe('fmt:raw-value');
  });
});
