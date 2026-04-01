import {
  DataResponse,
  Dimension,
  Granularity,
  LoadDataRequest,
  Value,
  loadData,
} from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import {
  shouldGetTopItems,
  buildAxisOrderArgs,
  buildResultsArgs,
  resolveResults,
} from '../bars.loadData.utils';

const meta = {
  name: 'BarChartGroupedHorizontalPro',
  label: 'Bar Chart - Grouped Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'yAxis', label: 'Y-axis' },
    { ...inputs.dimension, name: 'groupBy', label: 'Group by' },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, defaultValue: false },
    inputs.showLogarithmicScale,
    inputs.sortDirectionTopAxis,
    inputs.limitAxisItems,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
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
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type BarChartGroupedHorizontalProState = {
  granularity?: Granularity;
  axisOrder?: string[];
  axisOrderKey?: string;
};

const previewConfig = {
  yAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  yAxis?: Dimension,
  axisOrder?: string[],
): LoadDataRequest =>
  buildResultsArgs({
    dataset: inputs.dataset,
    axis: yAxis ?? inputs.yAxis,
    groupBy: inputs.groupBy,
    measure: inputs.measure,
    maxResults: inputs.maxResults,
    axisOrder,
  });

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  yAxis: Dimension,
  axisOrder?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, yAxis, axisOrder));

const loadDataResultsAxisOrderArgs = (
  inputs: Inputs<typeof meta>,
  yAxis: Dimension,
): LoadDataRequest =>
  buildAxisOrderArgs({
    dataset: inputs.dataset,
    axis: yAxis,
    measure: inputs.measure,
    sortDirection: inputs.sortDirectionTopAxis as string | undefined,
    limit: inputs.limitAxisItems,
  });

const loadDataResultsAxisOrder = (inputs: Inputs<typeof meta>, yAxis: Dimension): DataResponse =>
  loadData(loadDataResultsAxisOrderArgs(inputs, yAxis));

const events = {
  onBarClicked: (value: { axisDimensionValue?: string; groupingDimensionValue?: string }) => ({
    axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    BarChartGroupedHorizontalProState,
    (state: BarChartGroupedHorizontalProState) => void,
  ],
) => {
  const yAxisWithGranularity = getDimensionWithGranularity(inputs.yAxis, state?.granularity);
  const sortDirection = inputs.sortDirectionTopAxis as string | undefined;
  const needsTopItems = shouldGetTopItems(sortDirection, inputs.limitAxisItems);

  const axisOrderArgs = needsTopItems
    ? buildAxisOrderArgs({
        dataset: inputs.dataset,
        axis: yAxisWithGranularity,
        measure: inputs.measure,
        sortDirection,
        limit: inputs.limitAxisItems,
      })
    : undefined;
  const currentAxisOrderKey = axisOrderArgs ? JSON.stringify(axisOrderArgs) : undefined;

  const axisOrderFresh =
    currentAxisOrderKey != null &&
    currentAxisOrderKey === state?.axisOrderKey &&
    state?.axisOrder != null;

  return {
    ...inputs,
    yAxis: yAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    resultsAxisOrder: axisOrderArgs ? loadData(axisOrderArgs) : undefined,
    results: resolveResults(needsTopItems, axisOrderFresh, state?.axisOrder, (order) =>
      loadDataResults(inputs, yAxisWithGranularity, order),
    ),
    axisOrder: axisOrderFresh ? state?.axisOrder : undefined,
    currentAxisOrderKey,
    setAxisOrder: (axisOrder: string[], key: string) =>
      setState({ ...state, axisOrder, axisOrderKey: key }),
  };
};

export const barChartGroupedHorizontalPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsAxisOrder: {
    loadDataArgs: loadDataResultsAxisOrderArgs,
    loadData: loadDataResultsAxisOrder,
  },
} as const;
