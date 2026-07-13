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
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { subInputs } from '../../../component.subinputs.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { BarChartProOptionsClickArg } from '../bars.types';
import { getFirstMeasureOrderBy, loadDataOtherTotal } from '../../charts.other.loadData.utils';

const meta = {
  name: 'BarChartDefaultHorizontalPro',
  label: 'Bar Chart - Default Horizontal',
  description:
    'Same as BarChartDefaultPro but with horizontal bars. Pick when category labels are long or numerous.',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      inputs: [...inputs.measures.inputs, subInputs.color, subInputs.showValueAsPercentage],
    },
    { ...inputs.dimensionWithGranularitySelectField, label: 'Y-axis' },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.yAxisMaxItems,
    inputs.maxResults,
    inputs.menuOptions,
  ],
  events: [
    {
      name: 'onBarClicked',
      label: 'A bar is clicked',
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type BarChartDefaultHorizontalProState = {
  granularity?: Granularity;
};

const previewConfig = {
  dimension: previewData.dimension,
  measures: [previewData.measure],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  dimension?: Dimension,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [...inputs.measures, dimension ?? inputs.dimension],
  limit: inputs.maxResults,
  orderBy: getFirstMeasureOrderBy(inputs.measures),
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  dimension: Dimension,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, dimension, clientContext));

const events = {
  onBarClicked: (value: BarChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    BarChartDefaultHorizontalProState,
    (state: BarChartDefaultHorizontalProState) => void,
  ],
  clientContext: ThemeClientContext,
) => {
  const dimensionWithGranularity = getDimensionWithGranularity(
    inputs.dimension,
    state?.granularity,
  );

  return {
    ...inputs,
    dimension: dimensionWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, dimensionWithGranularity, clientContext),
    resultsOtherTotal: loadDataOtherTotal({
      dataset: inputs.dataset,
      measures: inputs.measures,
      maxItems: inputs.yAxisMaxItems,
      timezone: getClientContextTimezone(clientContext?.timezone),
    }),
  };
};

export const barChartDefaultHorizontalPro = {
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
