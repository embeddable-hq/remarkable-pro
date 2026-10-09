import type { Dimension, Measure } from '@embeddable.com/core';
import type { Mock } from 'vitest';
import * as XLSX from 'xlsx';
import { exportXLSX } from './export.utils';
import { getThemeFormatter } from '../formatter/formatter.utils';
import type { Theme } from '../theme.types';

vi.mock('../formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

// Use the real xlsx so we can assert on the resulting cell types; only stub the download.
vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  return { ...actual, writeFile: vi.fn() };
});

const dim = (name: string, nativeType = 'string') =>
  ({ name, title: name, nativeType, __type__: 'dimension' }) as unknown as Dimension;
const measure = (name: string, nativeType = 'number') =>
  ({ name, title: name, nativeType, __type__: 'measure' }) as unknown as Measure;

describe('exportXLSX cell types', () => {
  beforeEach(() => {
    (getThemeFormatter as Mock).mockReturnValue({
      dimensionOrMeasureTitle: (dm: Dimension) => dm.title,
    });
  });

  it('writes numeric measures as number cells and text dimensions as string cells', () => {
    exportXLSX({
      title: 'test',
      data: [{ zip: '01234', revenue: '1000.5' }],
      dimensionsAndMeasures: [dim('zip'), measure('revenue', 'sum')],
      theme: {} as Theme,
    });

    const workbook = (XLSX.writeFile as Mock).mock.calls[0]?.[0] as XLSX.WorkBook;
    const sheet = workbook.Sheets['Sheet1']!;
    expect(sheet['A2']).toMatchObject({ t: 's', v: '01234' });
    expect(sheet['B2']).toMatchObject({ t: 'n', v: 1000.5 });
  });
});
