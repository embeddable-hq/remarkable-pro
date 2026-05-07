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
import { LineChartGroupedProOptionsClickArg } from '../lines.types';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const meta = {
  name: 'LineChartGroupedPro',
  label: 'Line Chart - Grouped',
  description:
    'Line chart split into multiple lines by a grouping dimension — one time dim + one grouping dim + one measure.',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measure,
      inputs: [
        ...inputs.measure.inputs,
        {
          ...inputs.boolean,
          name: 'fillUnderLine',
          label: 'Fill under line',
          category: 'Component Settings',
        },
        {
          ...inputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
          category: 'Component Settings',
        },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, name: 'xAxis', label: 'X-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
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
        {
          name: 'axisDimensionTimeRange',
          label: 'Clicked axis dimension time range',
          type: 'timeRange',
        },
        {
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
        {
          name: 'groupingDimensionTimeRange',
          label: 'Clicked grouping dimension time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type LineChartGroupedProState = {
  granularity?: Granularity;
};

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
  onLineClicked: (value: LineChartGroupedProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
    groupingDimensionTimeRange: value.groupingDimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [LineChartGroupedProState, (state: LineChartGroupedProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, xAxisWithGranularity, clientContext),
  };
};

export const lineChartGroupedPro = {
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
