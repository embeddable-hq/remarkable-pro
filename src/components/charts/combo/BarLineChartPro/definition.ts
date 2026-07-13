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
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { BarLineChartProClickArg } from '../combo.types';
import { getFirstMeasureOrderBy, loadOtherTotal } from '../../charts.other.loadData.utils';

const meta = {
  name: 'BarLineChartPro',
  label: 'Bar + Line Chart',
  category: 'Combo Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      label: 'Bar measures',
      inputs: [...inputs.measures.inputs, subInputs.color, subInputs.showValueAsPercentage],
    },
    {
      ...inputs.measures,
      name: 'lineMeasures',
      label: 'Line measures',
      required: false,
      inputs: [
        ...inputs.measures.inputs,
        { ...subInputs.color, name: 'lineColor', label: 'Line color' },
        { ...subInputs.boolean, name: 'dashedLine', label: 'Dashed line', defaultValue: false },
        { ...subInputs.boolean, name: 'connectGaps', label: 'Connect gaps', defaultValue: true },
        { ...subInputs.boolean, name: 'fillUnderLine', label: 'Fill under line' },
        { ...subInputs.boolean, name: 'useSecondaryAxis', label: 'Assign to secondary axis' },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, label: 'X-axis' },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    { ...inputs.showValueLabels, name: 'showValueLabelsLine', label: 'Show value labels - line' },
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.reverseXAxis,
    inputs.xAxisMaxItems,
    {
      ...inputs.yAxisLabel,
      name: 'yAxisSecondaryLabel',
      label: 'Secondary Y-axis label',
      description: 'Label for the right-hand Y-axis used by line series.',
    },
    {
      ...inputs.yAxisRangeMin,
      name: 'yAxisSecondaryMin',
      label: 'Secondary Y-axis min',
      description: 'Minimum value for the right-hand Y-axis used by line series.',
    },
    {
      ...inputs.yAxisRangeMax,
      name: 'yAxisSecondaryMax',
      label: 'Secondary Y-axis max',
      description: 'Maximum value for the right-hand Y-axis used by line series.',
    },
    inputs.maxResults,
    inputs.menuOptions,
  ],
  events: [
    {
      name: 'onBarClicked',
      label: 'A bar is clicked',
      properties: [
        { name: 'axisDimensionValue', label: 'Clicked axis dimension value', type: 'string' },
        {
          name: 'axisDimensionTimeRange',
          label: 'Clicked axis dimension time range',
          type: 'timeRange',
        },
      ],
    },
    {
      name: 'onLineClicked',
      label: 'A line is clicked',
      properties: [
        { name: 'axisDimensionValue', label: 'Clicked axis dimension value', type: 'string' },
        {
          name: 'axisDimensionTimeRange',
          label: 'Clicked axis dimension time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type BarLineChartProState = {
  granularity?: Granularity;
};

const previewConfig = {
  dimension: previewData.dimension,
  measures: [previewData.measure],
  lineMeasures: [previewData.measureVariant],
  results: previewData.results2Measures1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  dimension?: Dimension,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [
    ...(inputs.measures ?? []),
    ...(inputs.lineMeasures ?? []),
    dimension ?? inputs.dimension,
  ],
  orderBy: getFirstMeasureOrderBy(inputs.measures ?? []),
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  dimension: Dimension,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, dimension, clientContext));

const events = {
  onBarClicked: (value: BarLineChartProClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
  onLineClicked: (value: BarLineChartProClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [BarLineChartProState, (state: BarLineChartProState) => void],
  clientContext: ThemeClientContext,
) => {
  const dimensionWithGranularity = getDimensionWithGranularity(
    inputs.dimension,
    state?.granularity,
  );

  return {
    ...inputs,
    dimension: dimensionWithGranularity,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, dimensionWithGranularity, clientContext),
    resultsOtherTotal: loadOtherTotal({
      dataset: inputs.dataset,
      measures: [...(inputs.measures ?? []), ...(inputs.lineMeasures ?? [])],
      maxItems: inputs.xAxisMaxItems,
      timezone: getClientContextTimezone(clientContext?.timezone),
    }),
  };
};

export const barLineChartPro = {
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
