import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import * as XLSX from 'xlsx';
import domtoimage from 'dom-to-image-more';
import { Chart } from 'chart.js';
import { Theme } from '../theme.types';
import { getThemeFormatter } from '../formatter/formatter.utils';
import { ChartCardMenuOptionOnClickProps } from '../defaults/defaults.ChartCardMenu.constants';

// RFC4180 cell-escaping: wrap in quotes and double any inner quotes
const escapeCell = (val: unknown): string => {
  const str = val == null ? '' : String(val);
  return `"${str.replace(/"/g, '""')}"`;
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
): Array<Array<string>> => {
  const themeFormatter = getThemeFormatter(theme);

  const headers = dimensionsAndMeasures.map((dm) => {
    return themeFormatter.dimensionOrMeasureTitle(dm);
  });
  const body = data!.map((dataRow) => {
    const row: Array<string> = [];
    dimensionsAndMeasures.forEach((dimensionOrMeasure) => {
      const value = dataRow[dimensionOrMeasure.name];
      if (value !== undefined && value !== null) {
        row.push(String(value));
      } else {
        row.push('');
      }
    });
    return row;
  });

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

/** PNG exports are rasterized at 2x CSS pixels so they stay sharp on high-DPI screens. */
export const PNG_EXPORT_SCALE = 2;

/**
 * Chart.js draws at the screen's device pixel ratio and dom-to-image copies that canvas as-is,
 * so charts below the export ratio are re-rendered at it for the duration of `render`.
 */
const withChartsAtPixelRatio = async <T>(
  element: HTMLElement,
  pixelRatio: number,
  render: () => Promise<T>,
): Promise<T> => {
  const charts = Array.from(element.querySelectorAll('canvas'))
    .map((canvas) => Chart.getChart(canvas))
    .filter((chart): chart is Chart => !!chart && chart.currentDevicePixelRatio < pixelRatio);

  if (charts.length === 0) {
    return render();
  }

  const originalRatios = charts.map((chart) => chart.options.devicePixelRatio);
  const setPixelRatio = (chart: Chart, ratio: number | undefined) => {
    chart.stop(); // a running animation would defer the resize to the next frame
    chart.options.devicePixelRatio = ratio;
    chart.resize();
  };

  try {
    charts.forEach((chart) => setPixelRatio(chart, pixelRatio));
    return await render();
  } finally {
    charts.forEach((chart, i) => {
      try {
        setPixelRatio(chart, originalRatios[i]);
      } catch (error) {
        // keep restoring the remaining charts
        console.warn('exportPNG: failed to restore chart pixel ratio', error);
      }
    });
  }
};

/**
 * dom-to-image keeps a clone's inline styles and won't override them with computed ones, which
 * loses any CSS that beats an inline style on screen (e.g. KpiChart's `!important` centering).
 */
export const stripInlineStyleFromClone = (_node: Node, clone: Node): void => {
  if (clone instanceof Element) {
    clone.removeAttribute('style');
  }
};

export async function exportPNG({
  title,
  containerRef,
  options,
}: ChartCardMenuOptionOnClickProps): Promise<void> {
  // Any valid CSS color. When omitted, the PNG background is transparent.
  const backgroundColor = options?.backgroundColor as string | undefined;

  const element = containerRef?.current;
  if (!element) {
    throw new Error('exportPNG: element is undefined');
  }

  try {
    const dataUrl = await withChartsAtPixelRatio<string>(element, PNG_EXPORT_SCALE, () =>
      domtoimage.toPng(element, {
        cacheBust: true,
        scale: PNG_EXPORT_SCALE,
        ...(backgroundColor && { bgcolor: backgroundColor }),
        adjustClonedNode: stripInlineStyleFromClone,
        filter: (node: unknown) => {
          if (node instanceof HTMLElement && node.hasAttribute('data-no-export')) {
            return false; // exclude elements with data-no-export
          }
          return true;
        },
      }),
    );

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
