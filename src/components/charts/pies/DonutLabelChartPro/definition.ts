import { DataResponse, LoadDataRequest, Measure, Value, loadData } from '@embeddable.com/core';
import { PieChartClickArg } from '../pies.types';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';

const meta = {
  name: 'DonutLabelChartPro',
  label: 'Donut Label Chart',
  description:
    'Same as DonutChartPro with a customizable center text label. Use when the center space can provide a useful summary (e.g. total, label).',
  category: 'Pie Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    { ...inputs.measure, inputs: [...inputs.measure.inputs, subInputs.showValueAsPercentage] },
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
    inputs.menuOptions,
    inputs.trackingId,
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

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure, inputs.dimension],
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const loadDataResultsInnerLabelArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.innerLabelMeasure],
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResultsInnerLabel = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): DataResponse => loadData(loadDataResultsInnerLabelArgs(inputs, clientContext));

const events = {
  onSegmentClick: (value: PieChartClickArg) => ({
    dimensionValue: value.dimensionValue ?? Value.noFilter(),
    dimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  _state: unknown,
  clientContext?: ThemeClientContext,
) => ({
  ...inputs,
  results: loadDataResults(inputs, clientContext),
  resultsInnerLabel: loadDataResultsInnerLabel(inputs, clientContext),
  componentName: meta.name,
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
