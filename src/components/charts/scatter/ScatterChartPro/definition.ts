import { DataResponse, LoadDataRequest, Value, loadData } from '@embeddable.com/core';
import type { ScatterChartProOptionsClickArg } from './ScatterChartPro.types';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { previewData } from '../../../preview.data.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import {
  scatterBaseInputs,
  scatterPointAndGroupInputs,
  scatterDisplayInputs,
} from '../scatter.definition.shared';

const meta = {
  name: 'ScatterChartPro',
  label: 'Scatter Chart',
  category: 'Scatter Charts',
  inputs: [...scatterBaseInputs, ...scatterPointAndGroupInputs, ...scatterDisplayInputs],
  events: [
    {
      name: 'onPointClick',
      label: 'A point is clicked',
      properties: [
        { name: 'xMeasureValue', label: 'Clicked X measure value', type: 'string' },
        { name: 'yMeasureValue', label: 'Clicked Y measure value', type: 'string' },
        { name: 'pointDimensionValue', label: 'Clicked point dimension value', type: 'string' },
        { name: 'groupByDimensionValue', label: 'Clicked group by value', type: 'string' },
        {
          name: 'pointDimensionTimeRange',
          label: 'Clicked point dimension time range',
          type: 'timeRange',
        },
        {
          name: 'groupByDimensionTimeRange',
          label: 'Clicked group by time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type ScatterChartProState = Record<string, never>;

const previewConfig = {
  dataset: previewData.dataset,
  xMeasure: previewData.measure,
  yMeasure: previewData.measureVariant,
  pointDimension: previewData.dimension,
  results: previewData.results2Measures1Dimension,
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
  onPointClick: (value: ScatterChartProOptionsClickArg) => ({
    xMeasureValue: value.xMeasureValue ?? Value.noFilter(),
    yMeasureValue: value.yMeasureValue ?? Value.noFilter(),
    pointDimensionValue: value.pointDimensionValue ?? Value.noFilter(),
    groupByDimensionValue: value.groupByDimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [_state, _setState]: [ScatterChartProState, (state: ScatterChartProState) => void],
  clientContext: ThemeClientContext,
) => ({
  ...inputs,
  pointColor: inputs.pointColor as string | undefined,
  results: loadDataResults(inputs, clientContext),
});

export const scatterChartPro = {
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
