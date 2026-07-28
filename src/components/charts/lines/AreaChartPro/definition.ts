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
import { AreaChartProAreaClickArg, AreaChartProPointClickArg } from '../lines.types';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { lineChartGroupedPro, LineChartGroupedProState } from '../LineChartGroupedPro/definition';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';

const meta = {
  ...lineChartGroupedPro.meta,
  name: 'AreaChartPro',
  label: 'Area Chart',
  events: [
    {
      name: 'onAreaClicked',
      label: 'An area is clicked',
      properties: [
        {
          name: 'segmentDimensionValue',
          label: 'Clicked segment dimension value',
          type: 'string',
        },
        {
          name: 'segmentDimensionTimeRange',
          label: 'Clicked segment dimension time range',
          type: 'timeRange',
        },
      ],
    },
    {
      name: 'onPointClicked',
      label: 'A point is clicked',
      properties: [
        {
          name: 'axisDimensionValue',
          label: 'Clicked axis dimension value',
          type: 'string',
        },
        {
          name: 'axisDimensionTimeRange',
          label: 'Clicked axis dimension time range',
          type: 'timeRange',
        },
        {
          name: 'measureValue',
          label: 'Clicked measure value',
          type: 'number',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type AreaChartProState = LineChartGroupedProState;

const previewConfig = {
  xAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  xAxis?: Dimension,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [xAxis ?? inputs.xAxis, inputs.groupBy, inputs.measure],
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, xAxis, clientContext));

const events = {
  onAreaClicked: (value: AreaChartProAreaClickArg) => ({
    segmentDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
    segmentDimensionTimeRange: value.groupingDimensionTimeRange ?? Value.noFilter(),
  }),
  onPointClicked: (value: AreaChartProPointClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
    measureValue: value.measureValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [AreaChartProState, (state: AreaChartProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, xAxisWithGranularity, clientContext),
    componentName: meta.name,
  };
};

export const areaChartPro = {
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
