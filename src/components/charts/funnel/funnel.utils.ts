import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { styles } from '@embeddable.com/remarkable-ui/styles';
import { ChartData } from 'chart.js';
// Type-only: pulls in chartjs-chart-funnel's module augmentation so 'funnel' is a valid Chart.js chart type.
import type {} from 'chartjs-chart-funnel';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { i18n } from '../../../theme/i18n/i18n';
import { remarkableTheme } from '../../../theme/theme.constants';
import { Theme } from '../../../theme/theme.types';
import { brightenColor, getColorGradient } from '../../../utils/color.utils';
import { getDimensionWithoutTruncation } from '../charts.utils';
import { FunnelPalette } from './funnel.types';

const PALETTE_BRIGHTEN_AMOUNT = 2.2;

export const getDefaultFunnelPalette = (): FunnelPalette => {
  const chartColors = getChartColors();
  const end =
    chartColors[0] || chartColors[chartColors.length - 1] || styles['--em-sem-chart-color--1'];
  return { start: brightenColor(end, PALETTE_BRIGHTEN_AMOUNT), end };
};

const resolveFunnelPalette = (startColor?: string, endColor?: string): FunnelPalette => {
  if (startColor && endColor) return { start: startColor, end: endColor };
  if (endColor) return { start: brightenColor(endColor, PALETTE_BRIGHTEN_AMOUNT), end: endColor };
  if (startColor)
    return { start: startColor, end: brightenColor(startColor, -PALETTE_BRIGHTEN_AMOUNT) };
  return getDefaultFunnelPalette();
};

const getStageColorOverride = (
  stageDimension: Dimension,
  theme: Theme,
  stageName: string,
): string | undefined => {
  const value = `${stageDimension.name}.${stageName}`;
  return (
    stageDimension.inputs?.color ??
    theme.charts.backgroundColorMap?.dimensionValue?.[value] ??
    theme.charts.borderColorMap?.dimensionValue?.[value]
  );
};

type FunnelStage = { name: string; count: number };

const aggregateFunnelStages = (
  data: DataResponse['data'],
  stageDimension: Dimension,
  countMeasure: Measure,
  orderDimension?: Dimension,
): FunnelStage[] => {
  const stageMap = new Map<string, number>();
  const orderMap = new Map<string, number>();

  for (const row of data ?? []) {
    const stageName = String(row[stageDimension.name] ?? '');
    if (!stageName) continue;
    const count = Number(row[countMeasure.name] ?? 0);
    stageMap.set(stageName, (stageMap.get(stageName) ?? 0) + count);
    if (orderDimension && !orderMap.has(stageName)) {
      const order = Number(row[orderDimension.name]);
      orderMap.set(stageName, Number.isFinite(order) ? order : Infinity);
    }
  }

  const names =
    orderDimension && orderMap.size
      ? [...stageMap.keys()].sort(
          (a, b) => (orderMap.get(a) ?? Infinity) - (orderMap.get(b) ?? Infinity),
        )
      : [...stageMap.keys()].sort((a, b) => (stageMap.get(b) ?? 0) - (stageMap.get(a) ?? 0));

  return names.map((name) => ({ name, count: stageMap.get(name) ?? 0 }));
};

export const getFunnelChartProData = (
  props: {
    data: DataResponse['data'];
    stageDimension: Dimension;
    countMeasure: Measure;
    orderDimension?: Dimension;
    startColor?: string;
    endColor?: string;
  },
  theme: Theme = remarkableTheme,
): ChartData<'funnel'> => {
  const stages = aggregateFunnelStages(
    props.data,
    props.stageDimension,
    props.countMeasure,
    props.orderDimension,
  );

  if (!stages.length) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  const palette = resolveFunnelPalette(props.startColor, props.endColor);
  const gradientColors = getColorGradient(palette.start, palette.end, stages.length);

  const backgroundColor = stages.map(
    (stage, index) =>
      getStageColorOverride(props.stageDimension, theme, stage.name) ?? gradientColors[index] ?? '',
  );

  const themeFormatter = getThemeFormatter(theme);
  const dimensionWithoutTruncation = getDimensionWithoutTruncation(props.stageDimension);

  return {
    labels: stages.map((stage) => {
      const formattedValue = themeFormatter.data(dimensionWithoutTruncation, stage.name);
      return stage.name === formattedValue ? i18n.t(stage.name) : formattedValue;
    }),
    datasets: [
      {
        data: stages.map((stage) => stage.count),
        backgroundColor,
      },
    ],
  };
};
