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
import { LineChartProOptionsClickArg } from '../lines.utils';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

const meta = {
  name: 'LineChartTabbedPro',
  label: 'Line Chart - Tabbed',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      inputs: [
        ...inputs.measures.inputs,
        { ...subInputs.boolean, name: 'fillUnderLine', label: 'Fill under line' },
        {
          ...subInputs.color,
          name: 'lineColor',
          label: 'Line color',
        },
        {
          ...subInputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
        },
        {
          ...subInputs.boolean,
          name: 'dashedLine',
          label: 'Dashed line',
          defaultValue: false,
        },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, label: 'X-axis', name: 'xAxis' },
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
    inputs.maxResults,
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type LineChartTabbedProState = {
  granularity?: Granularity;
};

const previewConfig = {
  xAxis: previewData.dimension,
  measures: [previewData.measure, previewData.measureVariant],
  results: previewData.results1Measure1Dimension,
  resultsTotals: previewData.results1Measure,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (inputs: Inputs<typeof meta>, xAxis?: Dimension): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [...inputs.measures, xAxis ?? inputs.xAxis],
});

const loadDataResults = (inputs: Inputs<typeof meta>, xAxis: Dimension): DataResponse =>
  loadData(loadDataResultsArgs(inputs, xAxis));

const loadDataResultsTotalsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [...inputs.measures],
});

const loadDataResultsTotals = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsTotalsArgs(inputs));

const events = {
  onLineClicked: (value: LineChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [LineChartTabbedProState, (state: LineChartTabbedProState) => void],
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, xAxisWithGranularity),
    resultsTotals: loadDataResultsTotals(inputs),
  };
};

export const lineChartTabbedPro = {
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
