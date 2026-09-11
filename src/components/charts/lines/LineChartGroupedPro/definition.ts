import { Granularity, OrderDirection, Value } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartGroupedProOptionsClickArg } from '../lines.types';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import {
  getGroupOrderCacheKey,
  getCachedGroupOrder,
  loadDataResultsGroupOrder,
  loadDataResultsGroupOther,
  loadDataResults,
} from '../../charts.loadData.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const meta = {
  name: 'LineChartGroupedPro',
  label: 'Line Chart - Grouped',
  description:
    'Line chart split into multiple lines by a grouping dimension — one time dim + one grouping dim + one measure.',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measure,
      inputs: [
        ...inputs.measure.inputs,
        {
          ...inputs.boolean,
          name: 'fillUnderLine',
          label: 'Fill under line',
          category: 'Component Settings',
        },
        {
          ...inputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
          category: 'Component Settings',
        },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, name: 'xAxis', label: 'X-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
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
      name: 'onLineClicked',
      label: 'A line is clicked',
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

export type LineChartGroupedProState = {
  granularity?: Granularity;
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
  onLineClicked: (value: LineChartGroupedProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
    groupingDimensionTimeRange: value.groupingDimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [LineChartGroupedProState, (state: LineChartGroupedProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const timezone = getClientContextTimezone(clientContext?.timezone);
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
    groupOrder: cachedGroupOrder,
    groupOrderCacheKey,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    setGroupOrderAndCacheKey: (groupOrder: string[], cacheKey: string) =>
      setState({ ...state, groupOrder, groupOrderCacheKey: cacheKey }),
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
      maxResults: inputs.maxResults,
      timezone,
    }),
    results: loadDataResults({
      dataset: inputs.dataset,
      axis: xAxisWithGranularity,
      groupBy: inputs.groupBy,
      measure: inputs.measure,
      limitTopGroupBy: inputs.limitTopGroupBy,
      maxResults: inputs.maxResults,
      groupOrder: cachedGroupOrder,
      timezone,
    }),
    componentName: meta.name,
  };
};

export const lineChartGroupedPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
} as const;
