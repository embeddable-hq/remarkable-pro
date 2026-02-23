import { DataResponse, LoadDataRequest, Measure, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'DonutLabelChartPro',
  label: 'Donut Label Chart',
  category: 'Pie Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.dimension,
    { ...inputs.measure, name: 'innerLabelMeasure', label: 'Inner label measure' },
    {
      ...inputs.string,
      name: 'innerLabelText',
      label: 'Inner label text',
      description: 'Text to display inside the donut chart',
      category: 'Component Data',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.maxLegendItems,
    inputs.showTooltips,
    inputs.showValueLabels,
  ],
  events: [
    {
      name: 'onSegmentClick',
      label: 'A segment is clicked',
      properties: [
        {
          name: 'dimensionValue',
          label: 'Clicked dimension',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  dimension: previewData.dimension,
  measure: previewData.measure,
  results: previewData.results1Measure1Dimension,
  innerLabelText: 'Total',
  resultsInnerLabel: {
    isLoading: false,
    error: undefined,
    data: [{ users: 500 }],
  },
  innerLabelMeasure: {
    name: 'users',
    title: 'Users',
    nativeType: 'number',
    __type__: 'measure',
  } as Measure,
  showValueLabels: false,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure, inputs.dimension],
});

const loadDataResults = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsArgs(inputs));

const loadDataResultsInnerLabelArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.innerLabelMeasure],
});

const loadDataResultsInnerLabel = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsInnerLabelArgs(inputs));

const events = {
  onSegmentClick: (value: { dimensionValue?: string }) => ({
    dimensionValue: value.dimensionValue ?? Value.noFilter(),
  }),
};

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  results: loadDataResults(inputs),
  resultsInnerLabel: loadDataResultsInnerLabel(inputs),
});

export const donutLabelChartPro = {
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
  resultsInnerLabel: {
    loadDataArgs: loadDataResultsInnerLabelArgs,
    loadData: loadDataResultsInnerLabel,
  },
} as const;
