import { describe, it, expect } from 'vitest';
import ExportOptionType, { ExportOption } from './ExportOption.type.emb';

describe('ExportOption', () => {
  it('exports the expected option keys', () => {
    expect(ExportOption.csv).toBe('csv');
    expect(ExportOption.xlsx).toBe('xlsx');
    expect(ExportOption.png).toBe('png');
  });
});

describe('ExportOptionType', () => {
  it('has the correct type name', () => {
    expect(ExportOptionType.toString()).toBe('exportOption');
  });

  it('optionLabel returns the value as-is', () => {
    expect(ExportOptionType.typeConfig.optionLabel('csv')).toBe('csv');
    expect(ExportOptionType.typeConfig.optionLabel('json')).toBe('json');
  });

  it('registers csv, xlsx and png options in the global registry', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = (globalThis as any).__EMBEDDABLE__?.types?.exportOption?.options;
    expect(options).toEqual(expect.arrayContaining(['csv', 'xlsx', 'png']));
  });
});
