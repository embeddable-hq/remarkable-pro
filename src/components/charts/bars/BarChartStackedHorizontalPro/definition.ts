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
import { buildAxisTotalFilter, buildSortLimitProps } from '../bars.sort.utils';
import type { BarChartSortState } from '../bars.sort.utils';

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
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.showTotalLabels,
    { ...inputs.sortByAxisTotal, label: 'Sort by y-axis total' },
    { ...inputs.limitAxisItems, label: 'Limit y-axis items' },
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
} & BarChartSortState;

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
  axisTotalValues?: string[],
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [yAxis ?? inputs.yAxis, inputs.groupBy, inputs.measure],
  filters: buildAxisTotalFilter(yAxis ?? inputs.yAxis, axisTotalValues),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  yAxis: Dimension,
  axisTotalValues?: string[],
): DataResponse => loadData(loadDataResultsArgs(inputs, yAxis, axisTotalValues));

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

  const sortLimitProps = buildSortLimitProps({
    dataset: inputs.dataset,
    axisDimension: yAxisWithGranularity,
    measure: inputs.measure,
    sortByAxisTotal: inputs.sortByAxisTotal as string | undefined,
    limitAxisItems: inputs.limitAxisItems as number | undefined,
    cachedState: state,
    updateSortState: (patch) => setState({ ...state, ...patch }),
    loadData,
    loadResults: (axisTotalValues) =>
      loadDataResults(inputs, yAxisWithGranularity, axisTotalValues),
  });

  return {
    ...inputs,
    yAxis: yAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    ...sortLimitProps,
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
} as const;
