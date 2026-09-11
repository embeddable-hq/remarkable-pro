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
  getGroupOrderCacheKey,
  getCachedGroupOrder,
  loadDataResultsGroupOrder,
  loadDataResultsGroupOther,
  loadDataResults,
} from '../../charts.loadData.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { BarChartStackedProOptionsClickArg } from '../bars.types';

const meta = {
  name: 'BarChartGroupedPro',
  label: 'Bar Chart - Grouped',
  description:
    'Vertical bar chart with side-by-side bars — one x-axis dimension, one grouping dimension, one measure. Use to compare sub-categories at each x value.',
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
    inputs.sortDirectionTopGroupBy,
    inputs.limitTopGroupBy,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.menuOptions,
    inputs.trackingId,
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

export type BarChartGroupedProState = {
  granularity?: Granularity;
  axisOrder?: string[];
  axisOrderCacheKey?: string;
  groupOrder?: string[];
  groupOrderCacheKey?: string;
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
  [state, setState]: [BarChartGroupedProState, (state: BarChartGroupedProState) => void],
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

  const groupSortDirection = inputs.sortDirectionTopGroupBy as OrderDirection | undefined;

  const groupOrderCacheKey = getGroupOrderCacheKey({
    dataset: inputs.dataset,
    groupBy: inputs.groupBy,
    measure: inputs.measure,
    sortDirection: groupSortDirection,
    limit: inputs.limitTopGroupBy,
    timezone,
  });

  const cachedGroupOrder = getCachedGroupOrder(groupOrderCacheKey, state);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    granularity: state?.granularity,
    axisOrder: cachedAxisOrder,
    axisOrderCacheKey,
    groupOrder: cachedGroupOrder,
    groupOrderCacheKey,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    setAxisOrderAndCacheKey: (axisOrder: string[], cacheKey: string) =>
      setState({ ...state, axisOrder, axisOrderCacheKey: cacheKey }),
    setGroupOrderAndCacheKey: (groupOrder: string[], cacheKey: string) =>
      setState({ ...state, groupOrder, groupOrderCacheKey: cacheKey }),
    resultsAxisOrder: loadDataResultsAxisOrder({
      dataset: inputs.dataset,
      limitTopAxis: inputs.limitTopXAxis,
      axis: xAxisWithGranularity,
      measure: inputs.measure,
      sortDirection,
      timezone,
    }),
    resultsGroupOrder: loadDataResultsGroupOrder({
      dataset: inputs.dataset,
      limitTopGroupBy: inputs.limitTopGroupBy,
      groupBy: inputs.groupBy,
      measure: inputs.measure,
      sortDirection: groupSortDirection,
      timezone,
    }),
    resultsGroupOther: loadDataResultsGroupOther({
      dataset: inputs.dataset,
      axis: inputs.xAxis,
      granularity: state?.granularity,
      measure: inputs.measure,
      groupOrder: cachedGroupOrder,
      axisOrder: cachedAxisOrder,
      maxResults: inputs.maxResults,
      timezone,
    }),
    results: loadDataResults({
      dataset: inputs.dataset,
      axis: xAxisWithGranularity,
      groupBy: inputs.groupBy,
      measure: inputs.measure,
      sortDirection,
      limitTopAxis: inputs.limitTopXAxis,
      limitTopGroupBy: inputs.limitTopGroupBy,
      maxResults: inputs.maxResults,
      axisOrder: cachedAxisOrder,
      groupOrder: cachedGroupOrder,
      timezone,
    }),
    componentName: meta.name,
  };
};

export const barChartGroupedPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
} as const;
