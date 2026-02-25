import { vi } from 'vitest';

vi.mock('../../assets/icons/cloud-download.svg', () => ({ default: 'cloud-download.svg' }));
vi.mock('../../assets/icons/photo-down.svg', () => ({ default: 'photo-down.svg' }));
vi.mock('../utils/export.utils', () => ({
  exportCSV: vi.fn(),
  exportXLSX: vi.fn(),
  exportPNG: vi.fn(),
}));

import { defaultChartMenuProOptions } from './defaults.ChartCardMenu.constants';

describe('defaultChartMenuProOptions', () => {
  it('has 3 options', () => {
    expect(defaultChartMenuProOptions).toHaveLength(3);
  });

  it('each option has a labelKey and onClick function', () => {
    for (const option of defaultChartMenuProOptions) {
      expect(typeof option.labelKey).toBe('string');
      expect(typeof option.onClick).toBe('function');
    }
  });

  it('has a Download CSV option', () => {
    expect(defaultChartMenuProOptions[0].labelKey).toBe('charts.menuOptions.downloadCSV');
  });

  it('has a Download XLSX option', () => {
    expect(defaultChartMenuProOptions[1].labelKey).toBe('charts.menuOptions.downloadXLSX');
  });

  it('has a Download PNG option', () => {
    expect(defaultChartMenuProOptions[2].labelKey).toBe('charts.menuOptions.downloadPNG');
  });
});
