import { Dataset, Dimension, Granularity, Measure, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

const meta = {
  name: 'BarChartDefaultPro',
  label: 'Bar Chart - Default',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    { ...inputs.measures, inputs: [...inputs.measures.inputs, inputs.color] },
    {
      ...inputs.dimensionWithGranularitySelectField,
      label: 'X-axis',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.xAxisMaxItems,
    inputs.maxResults,
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type BarChartDefaultProState = {
  granularity?: Granularity;
};

type LoadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  dimension?: Dimension,
) => {
  limit: number;
  from: Dataset;
  select: Array<Measure | Dimension>;
};

const loadDataResultsArgs: LoadDataResultsArgs = (inputs, dimension) => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [...inputs.measures, dimension ?? inputs.dimension],
});

const loadDataResults = (inputs: Inputs<typeof meta>, dimension: Dimension) =>
  loadData(loadDataResultsArgs(inputs, dimension));

const buildProps = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [BarChartDefaultProState, (state: BarChartDefaultProState) => void],
) => {
  const dimensionWithGranularity = getDimensionWithGranularity(
    inputs.dimension,
    state?.granularity,
  );

  return {
    ...inputs,
    dimension: dimensionWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, dimensionWithGranularity),
  };
};

const events = {
  onBarClicked: (value: { axisDimensionValue?: string }) => ({
    axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
  }),
};

const preview = definePreview(Component, {
  dimension: previewData.dimension,
  measures: [previewData.measure],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
});

export const barChartDefaultPro = {
  Component,
  meta,
  preview,
  config: {
    props: buildProps,
    events,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
} as const;
