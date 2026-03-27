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
  hasSortOrLimit,
  buildTotalsRequest,
  buildAxisTotalFilter,
  getTotalsRequestKey,
} from '../bars.sort.utils';

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
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.sortByAxisTotal,
    inputs.limitAxisItems,
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
  axisTotalValues?: string[];
  axisTotalsKey?: string;
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
  axisTotalValues?: string[],
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [xAxis ?? inputs.xAxis, inputs.groupBy, inputs.measure],
  filters: buildAxisTotalFilter(xAxis ?? inputs.xAxis, axisTotalValues),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  axisTotalValues?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, xAxis, axisTotalValues));

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
  const sortByAxisTotal = inputs.sortByAxisTotal as string | undefined;
  const limitAxisItems = inputs.limitAxisItems as number | undefined;
  const needsSortOrLimit = hasSortOrLimit(sortByAxisTotal, limitAxisItems);

  const totalsKey = needsSortOrLimit
    ? getTotalsRequestKey({
        sortByAxisTotal,
        limitAxisItems,
        axisDimensionName: xAxisWithGranularity.name,
        measureName: inputs.measure.name,
      })
    : undefined;

  const axisTotalValues =
    needsSortOrLimit && state?.axisTotalsKey === totalsKey ? state?.axisTotalValues : undefined;

  const totalsRequest = needsSortOrLimit
    ? buildTotalsRequest({
        dataset: inputs.dataset,
        axisDimension: xAxisWithGranularity,
        measure: inputs.measure,
        sortByAxisTotal,
        limitAxisItems,
      })
    : undefined;

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    totals: totalsRequest ? loadData(totalsRequest) : undefined,
    totalsKey,
    results:
      needsSortOrLimit && !axisTotalValues
        ? undefined
        : loadDataResults(inputs, xAxisWithGranularity, axisTotalValues),
    setAxisTotalValues: (values: string[], key?: string) =>
      setState({ ...state, axisTotalValues: values, axisTotalsKey: key }),
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
} as const;
