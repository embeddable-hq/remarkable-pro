import { Granularity, OrderDirection, Value } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import {
  getAxisOrderCacheKey,
  getCachedAxisOrder,
  loadDataResultsAxisOrder,
  loadDataResults,
} from '../bars.loadData.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { BarChartStackedProOptionsClickArg } from '../bars.types';

const meta = {
  name: 'BarChartStackedPro',
  label: 'Bar Chart - Stacked',
  description:
    'Vertical bar chart with stacked segments — two dimensions (x-axis + stack) and one measure. Use for parts-of-whole across categories.',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'xAxis', label: 'X-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, defaultValue: false },
    inputs.showLogarithmicScale,
    inputs.sortDirectionTopXAxis,
    inputs.limitTopXAxis,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.showTotalLabels,
    inputs.menuOptions,
  ],
  events: [
    {
      name: 'onBarClicked',
      label: 'A bar is clicked',
      properties: [
        {
          name: 'axisDimensionValue',
          label: 'Clicked axis dimension value',
          type: 'string',
        },
        {
          name: 'axisDimensionTimeRange',
          label: 'Clicked axis dimension time range',
          type: 'timeRange',
        },
        {
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
        {
          name: 'groupingDimensionTimeRange',
          label: 'Clicked grouping dimension time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type BarChartStackedProState = {
  granularity?: Granularity;
  axisOrder?: string[];
  axisOrderCacheKey?: string;
};

const previewConfig = {
  xAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const events = {
  onBarClicked: (value: BarChartStackedProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
    groupingDimensionTimeRange: value.groupingDimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [BarChartStackedProState, (state: BarChartStackedProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const sortDirection = inputs.sortDirectionTopXAxis as OrderDirection | undefined;
  const timezone = getClientContextTimezone(clientContext?.timezone);

  const axisOrderCacheKey = getAxisOrderCacheKey({
    dataset: inputs.dataset,
    axis: xAxisWithGranularity,
    measure: inputs.measure,
    sortDirection,
    limit: inputs.limitTopXAxis,
    timezone,
  });

  const cachedAxisOrder = getCachedAxisOrder(axisOrderCacheKey, state);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    axisOrder: cachedAxisOrder,
    axisOrderCacheKey,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    setAxisOrderAndCacheKey: (axisOrder: string[], cacheKey: string) =>
      setState({ ...state, axisOrder, axisOrderCacheKey: cacheKey }),
    resultsAxisOrder: loadDataResultsAxisOrder({
      dataset: inputs.dataset,
      limitTopAxis: inputs.limitTopXAxis,
      axis: xAxisWithGranularity,
      measure: inputs.measure,
      sortDirection,
      timezone,
    }),
    results: loadDataResults({
      dataset: inputs.dataset,
      axis: xAxisWithGranularity,
      groupBy: inputs.groupBy,
      measure: inputs.measure,
      sortDirection,
      limitTopAxis: inputs.limitTopXAxis,
      maxResults: inputs.maxResults,
      axisOrder: cachedAxisOrder,
      timezone,
    }),
  };
};

export const barChartStackedPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
} as const;
