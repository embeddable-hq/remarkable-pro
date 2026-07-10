import { DataResponse, LoadDataRequest, Value, loadData } from '@embeddable.com/core';
import { PieChartClickArg } from '../pies.types';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { getTopItemsOrderBy, loadOtherTotal } from '../../charts.other.loadData.utils';

const meta = {
  name: 'DonutChartPro',
  label: 'Donut Chart',
  description:
    'Donut chart for parts-of-whole over one dimension with one measure. Pick over PieChartPro when you want a center hole for a label or KPI.',
  category: 'Pie Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    { ...inputs.measure, inputs: [...inputs.measure.inputs, subInputs.showValueAsPercentage] },
    inputs.dimension,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.maxLegendItems,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.menuOptions,
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
        {
          name: 'dimensionTimeRange',
          label: 'Clicked dimension time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  dimension: previewData.dimension,
  measure: previewData.measure,
  results: previewData.results1Measure1Dimension,
  showValueLabels: false,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure, inputs.dimension],
  // Deterministic top-N ordering + full group count so the "Other" bucket can
  // be recovered correctly when the result set hits a query limit.
  orderBy: getTopItemsOrderBy([inputs.measure]),
  countRows: true,
});

const loadDataResults = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsArgs(inputs));

const events = {
  onSegmentClick: (value: PieChartClickArg) => ({
    dimensionValue: value.dimensionValue ?? Value.noFilter(),
    dimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  results: loadDataResults(inputs),
  resultsOtherTotal: loadOtherTotal({
    dataset: inputs.dataset,
    measures: [inputs.measure],
    maxItems: inputs.maxLegendItems,
  }),
});

export const donutChartPro = {
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
