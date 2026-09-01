import {
  DataResponse,
  Dimension,
  LoadDataRequest,
  Measure,
  loadData,
  mockDataResponse,
  mockDimension,
  mockMeasure,
} from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';

const meta = {
  name: 'FunnelChartPro',
  label: 'Funnel Chart',
  description: 'Funnel chart for a count over an ordered set of stages, e.g. a severity pyramid.',
  category: 'Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    {
      ...inputs.dimension,
      name: 'stageDimension',
      label: 'Stage',
      description: 'The column that identifies each funnel stage, e.g. severity_level',
    },
    {
      ...inputs.measure,
      name: 'countMeasure',
      label: 'Count',
      description: 'The measure that counts events at each stage',
    },
    {
      ...inputs.dimension,
      name: 'orderDimension',
      label: 'Order (optional)',
      required: false,
      description:
        'Optional numeric dimension that defines stage order (ascending). When set, overrides the default descending-by-count order, e.g. severity_order INTEGER.',
    },
    {
      ...inputs.color,
      name: 'startColor',
      label: 'Start color (lowest stage)',
      description: 'Overrides the theme default gradient. The other end auto-derives if unset.',
    },
    {
      ...inputs.color,
      name: 'endColor',
      label: 'End color (highest stage)',
      description: 'Overrides the theme default gradient. The other end auto-derives if unset.',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    {
      ...inputs.boolean,
      name: 'showPercentage',
      label: 'Show percentage',
      description: 'Show percentage of total instead of the raw count on each stage.',
      defaultValue: false,
      category: 'Component Settings',
    },
    inputs.menuOptions,
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  stageDimension: mockDimension('severity', 'string', { title: 'Severity Level' }),
  countMeasure: mockMeasure('count', 'number', { title: 'Count' }),
  showPercentage: false,
  showLegend: true,
  results: mockDataResponse(
    ['severity', 'count'],
    [
      ['Near Misses', '33'],
      ['Injury/Illness', '30'],
      ['Recordable', '14'],
      ['DART', '5'],
    ],
  ),
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [
    inputs.stageDimension as unknown as Dimension,
    inputs.countMeasure as unknown as Measure,
    ...(inputs.orderDimension ? [inputs.orderDimension as unknown as Dimension] : []),
  ],
});

const loadDataResults = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsArgs(inputs));

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  startColor: inputs.startColor as string | undefined,
  endColor: inputs.endColor as string | undefined,
  results: loadDataResults(inputs),
});

export const funnelChartPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
} as const;
