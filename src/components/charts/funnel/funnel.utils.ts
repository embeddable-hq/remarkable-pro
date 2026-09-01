import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartData } from 'chart.js';
// Side-effect import: augments Chart.js's ChartTypeRegistry with the 'funnel' chart type.
import type {} from 'chartjs-chart-funnel';
import { Theme } from '../../../theme/theme.types';
import { remarkableTheme } from '../../../theme/theme.constants';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { getDimensionWithoutTruncation } from '../charts.utils';
import { brightenColor, getColorGradient } from '../../../utils/color.utils';
import { i18n } from '../../../theme/i18n/i18n';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { FunnelPalette } from './funnel.types';

export const getDefaultFunnelPalette = (): FunnelPalette => {
  const end = getChartColors()[0] ?? '#FBC02D';
  return { start: brightenColor(end, 2.2), end };
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

  const palette: FunnelPalette =
    props.startColor && props.endColor
      ? { start: props.startColor, end: props.endColor }
      : getDefaultFunnelPalette();

  const backgroundColor = getColorGradient(palette.start, palette.end, stages.length);
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
