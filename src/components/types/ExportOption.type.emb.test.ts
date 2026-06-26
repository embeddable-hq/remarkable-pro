import { describe, it, expect } from 'vitest';
import ExportOptionType, { ExportOptionTypeOptions } from './ExportOption.type.emb';

describe('ExportOptionTypeOptions', () => {
  it('exports the expected option keys', () => {
    expect(ExportOptionTypeOptions.csv).toBe('csv');
    expect(ExportOptionTypeOptions.xlsx).toBe('xlsx');
    expect(ExportOptionTypeOptions.png).toBe('png');
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
