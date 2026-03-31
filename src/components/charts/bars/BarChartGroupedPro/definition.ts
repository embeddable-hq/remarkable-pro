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
import { hasSortOrLimit, loadDataTotalsArgs, loadDataMainArgs } from '../bars.loadData.utils';

const meta = {
  name: 'BarChartGroupedPro',
  label: 'Bar Chart - Grouped',
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
    inputs.sortByAxisTotal,
    inputs.limitAxisItems,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
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

export type BarChartGroupedProState = {
  granularity?: Granularity;
  axisItems?: string[];
  axisItemsKey?: string;
};

const previewConfig = {
  xAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  xAxis?: Dimension,
  topAxisValues?: string[],
): LoadDataRequest =>
  loadDataMainArgs(
    inputs.dataset,
    xAxis ?? inputs.xAxis,
    inputs.groupBy,
    inputs.measure,
    inputs.maxResults,
    topAxisValues,
  );

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  topAxisValues?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, xAxis, topAxisValues));

const loadDataResultsTotalsArgs = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
): LoadDataRequest =>
  loadDataTotalsArgs(
    inputs.dataset,
    xAxis,
    inputs.measure,
    inputs.sortByAxisTotal as string | undefined,
    inputs.limitAxisItems,
  );

const loadDataResultsTotals = (inputs: Inputs<typeof meta>, xAxis: Dimension): DataResponse =>
  loadData(loadDataResultsTotalsArgs(inputs, xAxis));

const events = {
  onBarClicked: (value: { axisDimensionValue?: string; groupingDimensionValue?: string }) => ({
    axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [BarChartGroupedProState, (state: BarChartGroupedProState) => void],
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const needsSortLimit = hasSortOrLimit(
    inputs.sortByAxisTotal as string | undefined,
    inputs.limitAxisItems,
  );

  const currentTotalsKey = needsSortLimit
    ? JSON.stringify(loadDataResultsTotalsArgs(inputs, xAxisWithGranularity))
    : undefined;

  const axisItemsFresh =
    currentTotalsKey != null &&
    currentTotalsKey === state?.axisItemsKey &&
    (state?.axisItems?.length ?? 0) > 0;

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    resultsTotals: needsSortLimit ? loadDataResultsTotals(inputs, xAxisWithGranularity) : undefined,
    results: needsSortLimit
      ? axisItemsFresh
        ? loadDataResults(inputs, xAxisWithGranularity, state!.axisItems)
        : undefined
      : loadDataResults(inputs, xAxisWithGranularity),
    axisItems: state?.axisItems,
    currentTotalsKey,
    setAxisItems: (axisItems: string[], key: string) =>
      setState({ ...state, axisItems, axisItemsKey: key }),
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
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsTotals: {
    loadDataArgs: loadDataResultsTotalsArgs,
    loadData: loadDataResultsTotals,
  },
} as const;
