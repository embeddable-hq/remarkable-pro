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
import { subInputs } from '../../../component.subinputs.constants';

const meta = {
  name: 'BarChartDefaultWithLinePro',
  label: 'Bar Chart - Default with Line',
  category: 'Bar Charts',
  inputs: [
    { ...inputs.dataset, category: 'Chart Data' },
    {
      ...inputs.dimensionWithGranularitySelectField,
      label: 'X-axis',
      category: 'Chart Data',
    },
    {
      ...inputs.measures,
      category: 'Chart Data',
      inputs: [...inputs.measures.inputs, subInputs.color, subInputs.showValueAsPercentage],
    },
    {
      name: 'lineMeasures',
      type: 'measure',
      label: 'Line measures',
      array: true,
      config: {
        dataset: 'dataset',
      },
      category: 'Chart Data',
      inputs: [...inputs.measures.inputs, subInputs.color],
    },
    {
      name: 'showSecondYAxis',
      type: 'boolean',
      label: 'Show second Y-axis',
      defaultValue: false,
      category: 'Axes Settings',
    },
    {
      name: 'yAxisLabelSecondary',
      type: 'string',
      label: 'Second Y-axis label',
      category: 'Axes Settings',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, label: 'Show value labels - bar' },
    {
      name: 'showValueLabelsLine',
      type: 'boolean',
      label: 'Show value labels - line',
      defaultValue: true,
      category: 'Component Settings',
    },
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

export type BarChartDefaultWithLineProState = {
  granularity?: Granularity;
};

const previewConfig = {
  dimension: previewData.dimension,
  measures: [previewData.measure],
  lineMeasures: [previewData.measureVariant],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  dimension?: Dimension,
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [...inputs.measures, ...(inputs.lineMeasures ?? []), dimension ?? inputs.dimension],
});

const loadDataResults = (inputs: Inputs<typeof meta>, dimension: Dimension): DataResponse =>
  loadData(loadDataResultsArgs(inputs, dimension));

const events = {
  onBarClicked: (value: { axisDimensionValue?: string }) => ({
    axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    BarChartDefaultWithLineProState,
    (state: BarChartDefaultWithLineProState) => void,
  ],
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

export const barChartDefaultWithLinePro = {
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
