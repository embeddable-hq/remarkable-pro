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
  name: 'BarChartStackedPro',
  label: 'Bar Chart - Stacked',
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

export type BarChartStackedProState = {
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
  axisItems?: string[],
): LoadDataRequest =>
  loadDataMainArgs(
    inputs.dataset,
    xAxis ?? inputs.xAxis,
    inputs.groupBy,
    inputs.measure,
    inputs.maxResults,
    axisItems,
  );

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  axisItems?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, xAxis, axisItems));

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
  [state, setState]: [BarChartStackedProState, (state: BarChartStackedProState) => void],
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const needsSortLimit = hasSortOrLimit(
    inputs.sortByAxisTotal as string | undefined,
    inputs.limitAxisItems,
  );

  const totalsArgs = needsSortLimit
    ? loadDataResultsTotalsArgs(inputs, xAxisWithGranularity)
    : undefined;
  const currentTotalsKey = totalsArgs ? JSON.stringify(totalsArgs) : undefined;

  const axisItemsFresh =
    currentTotalsKey != null &&
    currentTotalsKey === state?.axisItemsKey &&
    (state?.axisItems?.length ?? 0) > 0;

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    resultsTotals: totalsArgs ? loadData(totalsArgs) : undefined,
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

export const barChartStackedPro = {
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
