import {
  CUBE_DIMENSION_TYPE_NUMBER,
  CUBE_MEASURE_TYPE_BOOLEAN,
  CUBE_MEASURE_TYPE_STRING,
  CUBE_MEASURE_TYPE_TIME,
  DataResponse,
  Dimension,
  Measure,
  isDimension,
  isMeasure,
} from '@embeddable.com/core';
import * as XLSX from 'xlsx';
import domtoimage from 'dom-to-image-more';
import { Theme } from '../theme.types';
import { getThemeFormatter } from '../formatter/formatter.utils';
import { ChartCardMenuOptionOnClickProps } from '../defaults/defaults.ChartCardMenu.constants';

type ExportCell = string | number;

// Measures are numeric unless Cube says otherwise, so new numeric types (and a missing
// nativeType on code-configured measures) are covered without maintaining a list of them.
const NON_NUMERIC_MEASURE_TYPES: ReadonlySet<string> = new Set([
  CUBE_MEASURE_TYPE_STRING,
  CUBE_MEASURE_TYPE_TIME,
  CUBE_MEASURE_TYPE_BOOLEAN,
]);

// Cube returns measure values as strings, so numeric columns need to be coerced explicitly.
// Decided by column type (not by sniffing values) so text like zip codes keeps its leading zeros.
const isNumericColumn = (dimensionOrMeasure: Dimension | Measure): boolean => {
  if (isMeasure(dimensionOrMeasure)) {
    return !NON_NUMERIC_MEASURE_TYPES.has(dimensionOrMeasure.nativeType);
  }
  if (isDimension(dimensionOrMeasure)) {
    return dimensionOrMeasure.nativeType === CUBE_DIMENSION_TYPE_NUMBER;
  }
  return false;
};

const INTEGER_STRING = /^[+-]?\d+$/;

// Returns the number only when it's a faithful representation of the string value.
const toNumber = (str: string): number | undefined => {
  const trimmed = str.trim();
  if (trimmed === '') return undefined; // Number('  ') is 0
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return undefined; // NaN, Infinity
  // Integers beyond the safe range would silently lose digits, so keep them as text
  if (INTEGER_STRING.test(trimmed) && !Number.isSafeInteger(num)) return undefined;
  return num;
};

const stringifyValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  // Objects would stringify to '[object Object]', so serialize them instead
  return JSON.stringify(value) ?? '';
};

const toCell = (value: unknown, numeric: boolean): ExportCell => {
  if (value === undefined || value === null || value === '') return '';
  const str = stringifyValue(value);
  if (numeric) {
    const num = toNumber(str);
    if (num !== undefined) return num;
  }
  return str;
};

// RFC4180 cell-escaping: only quote when needed, and double any inner quotes
const escapeCell = (cell: ExportCell): string => {
  const str = String(cell);
  if (typeof cell === 'string' && /[",\r\n]|^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadBlob = (url: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const formatData = (
  data: DataResponse['data'],
  dimensionsAndMeasures: (Dimension | Measure)[],
  theme: Theme,
): Array<Array<ExportCell>> => {
  const themeFormatter = getThemeFormatter(theme);

  const headers = dimensionsAndMeasures.map((dm) => {
    return themeFormatter.dimensionOrMeasureTitle(dm);
  });
  const columns = dimensionsAndMeasures.map((dm) => ({
    name: dm.name,
    numeric: isNumericColumn(dm),
  }));
  const body = data!.map((dataRow) =>
    columns.map(({ name, numeric }) => toCell(dataRow[name], numeric)),
  );

  return [headers, ...body];
};

export function exportCSV({
  data = [],
  dimensionsAndMeasures = [],
  title,
  theme,
}: ChartCardMenuOptionOnClickProps) {
  const csvData = formatData(data, dimensionsAndMeasures, theme)
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, `${title ?? 'untitled'}.csv`);
}

export function exportXLSX({
  data = [],
  dimensionsAndMeasures = [],
  title,
  theme,
}: ChartCardMenuOptionOnClickProps) {
  const xlsxData = formatData(data, dimensionsAndMeasures, theme);

  const worksheet = XLSX.utils.aoa_to_sheet(xlsxData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // XLSX.writeFile handles blob creation & download for us
  XLSX.writeFile(workbook, `${title ?? 'untitled'}.xlsx`);
}

export async function exportPNG({
  title,
  containerRef,
}: ChartCardMenuOptionOnClickProps): Promise<void> {
  const element = containerRef?.current;
  if (!element) {
    throw new Error('exportPNG: element is undefined');
  }

  try {
    const dataUrl = await domtoimage.toPng(element, {
      cacheBust: true,
      filter: (node: unknown) => {
        if (node instanceof HTMLElement && node.hasAttribute('data-no-export')) {
          return false; // exclude elements with data-no-export
        }
        return true;
      },
    });

    // Convert data URL to Blob for download
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    downloadBlob(url, `${title ?? 'untitled'}.png`);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`exportPNG failed: ${(error as Error).message}`);
  }
}
