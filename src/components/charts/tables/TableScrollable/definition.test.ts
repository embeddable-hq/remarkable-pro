import { describe, it, expect, vi } from 'vitest';

// Mock UI deps so importing the definition doesn't load real CSS-bundled packages.
vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
  useEmbeddableLayout: vi.fn(() => ({ heightMode: 'fixed' })),
  HEIGHT_MODES: { fixed: 'fixed', auto: 'auto' },
  definePreview: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn(() => '') },
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: () => null,
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  TableScrollable: () => null,
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({ number: (value: number) => String(value) })),
}));

vi.mock('../tables.utils', () => ({
  getTableHeaders: vi.fn(() => []),
  getTableRows: vi.fn(() => []),
}));

// Left un-mocked: it's the logic under test.
const { tableScrollable } = await import('./definition');

/* eslint-disable @typescript-eslint/no-explicit-any */
const inputsWith = (overrides: Record<string, unknown> = {}) =>
  ({
    dataset: { name: 'ds' },
    dimensionsAndMeasures: [],
    maxResults: 5000,
    autoHeightMaxResults: 100,
    ...overrides,
  }) as any;

const stateWith = (heightMode?: string) =>
  ({ page: 0, isLoadingDownloadData: false, heightMode }) as any;

const findInput = (name: string) =>
  tableScrollable.meta.inputs.find((input) => input.name === name);

describe('TableScrollable definition', () => {
  it('keeps the download allowance and the expanded row limit as separate inputs', () => {
    const download = findInput('maxResults');
    const expanded = findInput('autoHeightMaxResults');

    expect(download).toBeDefined();
    expect(expanded).toBeDefined();
    expect((download as any).defaultValue).toBe(1000);
    expect((expanded as any).defaultValue).toBe(100);
  });

  it('limits the expanded table by its own input, not by the download allowance', () => {
    const args = tableScrollable.results.loadDataArgs(
      inputsWith(),
      stateWith('auto'),
      [],
      [],
      {} as any,
    );

    expect(args).toMatchObject({ offset: 0, limit: 100, countRows: true });
  });

  it('still limits the download by the download allowance', () => {
    const args = tableScrollable.allResults.loadDataArgs(inputsWith(), [], {} as any);

    expect(args).toMatchObject({ limit: 5000 });
  });

  it('pages a fixed-height table rather than using either allowance', () => {
    const args = tableScrollable.results.loadDataArgs(
      inputsWith(),
      stateWith('fixed'),
      [],
      [],
      {} as any,
    );

    expect(args).toMatchObject({ offset: 0, limit: 50 });
    expect(args).not.toHaveProperty('countRows', true);
  });
});
