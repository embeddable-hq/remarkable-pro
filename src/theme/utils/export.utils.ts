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

/**
 * Rasterize PNG exports at 2x CSS pixels so they stay sharp on high-DPI screens and in print.
 * Without this, dom-to-image renders at the on-screen CSS size with no device-pixel-ratio scaling.
 */
export const PNG_EXPORT_SCALE = 2;

/**
 * Chart.js sizes its canvas backing store from the *screen's* device pixel ratio, and dom-to-image
 * copies that backing store as-is. On a 1x screen the chart body would therefore be upscaled and
 * blurry even though the surrounding DOM renders crisply at PNG_EXPORT_SCALE. Temporarily
 * re-render any lower-resolution charts at the export ratio, then restore them.
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
    // Chart.js defers a resize to its next animation frame while an animation is running, and
    // frames never fire in a hidden tab. Stopping the animation makes the resize (and the redraw
    // at the new ratio) synchronous.
    chart.stop();
    chart.options.devicePixelRatio = ratio;
    chart.resize();
  };

  charts.forEach((chart) => setPixelRatio(chart, pixelRatio));
  try {
    return await render();
  } finally {
    charts.forEach((chart, i) => setPixelRatio(chart, originalRatios[i]));
  }
};

/**
 * dom-to-image copies each element's computed style onto its clone, but keeps the clone's inline
 * `style` attribute and never overrides a property that attribute already sets. Any CSS rule that
 * beats an inline style on screen (e.g. `align-items: center !important` over AutoTextSize's inline
 * `align-items: start` in KpiChart) is therefore lost in the export. The computed style already
 * reflects inline styles, so dropping the attribute from the clone loses nothing.
 */
export const stripInlineStyleFromClone = (_node: Node, clone: Node): void => {
  if (clone instanceof Element) {
    clone.removeAttribute('style');
  }
};

export async function exportPNG({
  title,
  containerRef,
}: ChartCardMenuOptionOnClickProps): Promise<void> {
  const element = containerRef?.current;
  if (!element) {
    throw new Error('exportPNG: element is undefined');
  }

  try {
    const dataUrl = await withChartsAtPixelRatio<string>(element, PNG_EXPORT_SCALE, () =>
      domtoimage.toPng(element, {
        cacheBust: true,
        scale: PNG_EXPORT_SCALE,
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
