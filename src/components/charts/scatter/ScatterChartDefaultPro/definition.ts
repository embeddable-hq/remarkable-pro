import { DataResponse, LoadDataRequest, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const showPointLabels = {
  ...inputs.boolean,
  name: 'showPointLabels',
  label: 'Show point labels',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const meta = {
  name: 'ScatterChartDefaultPro',
  label: 'Scatter Chart',
  category: 'Scatter Charts',
  inputs: [
    inputs.dataset,
    inputs.xMeasure,
    inputs.yMeasure,
    {
      ...inputs.dimension,
      name: 'pointDimension',
      label: 'Point dimension',
    },
    {
      ...inputs.dimension,
      name: 'groupByDimension',
      label: 'Group by (optional)',
      required: false,
    },
    {
      ...subInputs.color,
      name: 'pointColor',
      label: 'Point color',
      category: 'Component Settings',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    showPointLabels,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.maxResults,
  ],
  events: [
    {
      name: 'onPointClick',
      label: 'A point is clicked',
      properties: [
        {
          name: 'xMeasureValue',
          label: 'Clicked X measure value',
          type: 'string',
        },
        {
          name: 'yMeasureValue',
          label: 'Clicked Y measure value',
          type: 'string',
        },
        {
          name: 'pointDimensionValue',
          label: 'Clicked point dimension value',
          type: 'string',
        },
        {
          name: 'groupByDimensionValue',
          label: 'Clicked group by value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  dataset: previewData.dataset,
  xMeasure: previewData.measure,
  yMeasure: previewData.measureVariant,
  pointDimension: previewData.dimension,
  results: previewData.resultsScatterXY,
  showLegend: true,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [
    inputs.xMeasure,
    inputs.yMeasure,
    inputs.pointDimension,
    ...(inputs.groupByDimension ? [inputs.groupByDimension] : []),
  ],
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const events = {
  onPointClick: (value: {
    xMeasureValue?: string;
    yMeasureValue?: string;
    pointDimensionValue?: string;
    groupByDimensionValue?: string | null;
  }) => ({
    xMeasureValue: value.xMeasureValue ?? Value.noFilter(),
    yMeasureValue: value.yMeasureValue ?? Value.noFilter(),
    pointDimensionValue: value.pointDimensionValue ?? Value.noFilter(),
    groupByDimensionValue: value.groupByDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  _state: unknown,
  clientContext: ThemeClientContext,
) => ({
  ...inputs,
  pointColor: inputs.pointColor as string | undefined,
  results: loadDataResults(inputs, clientContext),
});

export const scatterChartDefaultPro = {
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
