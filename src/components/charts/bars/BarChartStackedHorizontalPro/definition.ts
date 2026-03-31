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
  name: 'BarChartStackedHorizontalPro',
  label: 'Bar Chart - Stacked Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'yAxis', label: 'Y-axis' },
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
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.showTotalLabels,
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

export type BarChartStackedHorizontalProState = {
  granularity?: Granularity;
  axisItems?: string[];
  axisItemsKey?: string;
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
  topAxisValues?: string[],
): LoadDataRequest =>
  loadDataMainArgs(
    inputs.dataset,
    yAxis ?? inputs.yAxis,
    inputs.groupBy,
    inputs.measure,
    inputs.maxResults,
    topAxisValues,
  );

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  yAxis: Dimension,
  topAxisValues?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, yAxis, topAxisValues));

const loadDataResultsTotalsArgs = (
  inputs: Inputs<typeof meta>,
  yAxis: Dimension,
): LoadDataRequest =>
  loadDataTotalsArgs(
    inputs.dataset,
    yAxis,
    inputs.measure,
    inputs.sortByAxisTotal as string | undefined,
    inputs.limitAxisItems,
  );

const loadDataResultsTotals = (inputs: Inputs<typeof meta>, yAxis: Dimension): DataResponse =>
  loadData(loadDataResultsTotalsArgs(inputs, yAxis));

const events = {
  onBarClicked: (value: { axisDimensionValue?: string; groupingDimensionValue?: string }) => ({
    axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    BarChartStackedHorizontalProState,
    (state: BarChartStackedHorizontalProState) => void,
  ],
) => {
  const yAxisWithGranularity = getDimensionWithGranularity(inputs.yAxis, state?.granularity);
  const needsSortLimit = hasSortOrLimit(
    inputs.sortByAxisTotal as string | undefined,
    inputs.limitAxisItems,
  );

  const currentTotalsKey = needsSortLimit
    ? JSON.stringify(loadDataResultsTotalsArgs(inputs, yAxisWithGranularity))
    : undefined;

  const axisItemsFresh =
    currentTotalsKey != null &&
    currentTotalsKey === state?.axisItemsKey &&
    (state?.axisItems?.length ?? 0) > 0;

  return {
    ...inputs,
    yAxis: yAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    resultsTotals: needsSortLimit ? loadDataResultsTotals(inputs, yAxisWithGranularity) : undefined,
    results: needsSortLimit
      ? axisItemsFresh
        ? loadDataResults(inputs, yAxisWithGranularity, state!.axisItems)
        : undefined
      : loadDataResults(inputs, yAxisWithGranularity),
    axisItems: state?.axisItems,
    currentTotalsKey,
    setAxisItems: (axisItems: string[], key: string) =>
      setState({ ...state, axisItems, axisItemsKey: key }),
  };
};

export const barChartStackedHorizontalPro = {
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
