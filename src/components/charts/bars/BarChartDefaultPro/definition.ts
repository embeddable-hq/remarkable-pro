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
import {
  getCachedOtherBucketState,
  getOtherBucketAggregateArgs,
  getOtherBucketCacheKey,
  OtherBucketHeadInfo,
} from '../../charts.otherBucket.utils';

const meta = {
  name: 'BarChartDefaultPro',
  label: 'Bar Chart - Default',
  description:
    'Vertical bar chart with one categorical x-axis dimension and one or more measures. Use to compare values across discrete categories.',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      inputs: [...inputs.measures.inputs, subInputs.color, subInputs.showValueAsPercentage],
    },
    {
      ...inputs.dimensionWithGranularitySelectField,
      label: 'X-axis',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.xAxisMaxItems,
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

export type BarChartDefaultProState = {
  granularity?: Granularity;
  otherBucketActive?: boolean;
  otherBucketHeadValues?: string[];
  otherBucketCacheKey?: string;
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
  limit: inputs.maxResults,
  from: inputs.dataset,
  select: [...inputs.measures, dimension ?? inputs.dimension],
  orderBy: inputs.measures[0] ? [{ property: inputs.measures[0], direction: 'desc' }] : undefined,
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
  [state, setState]: [BarChartDefaultProState, (state: BarChartDefaultProState) => void],
  clientContext: ThemeClientContext,
) => {
  const dimensionWithGranularity = getDimensionWithGranularity(
    inputs.dimension,
    state?.granularity,
  );
  const timezone = getClientContextTimezone(clientContext?.timezone);
  const primaryRequest = loadDataResultsArgs(inputs, dimensionWithGranularity, clientContext);
  const otherBucketCacheKey = getOtherBucketCacheKey(primaryRequest, inputs.xAxisMaxItems);
  const cachedOtherBucket = getCachedOtherBucketState(otherBucketCacheKey, state);

  return {
    ...inputs,
    dimension: dimensionWithGranularity,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    otherBucketActive: cachedOtherBucket.active,
    otherBucketHeadValues: cachedOtherBucket.headValues,
    otherBucketCacheKey,
    setOtherBucketState: (info: OtherBucketHeadInfo, cacheKey: string) =>
      setState({
        ...state,
        otherBucketActive: info.active,
        otherBucketHeadValues: info.headValues,
        otherBucketCacheKey: cacheKey,
      }),
    results: loadData(primaryRequest),
    resultsOtherBucket: loadData(
      getOtherBucketAggregateArgs({
        dataset: inputs.dataset,
        dimension: dimensionWithGranularity,
        measures: inputs.measures,
        active: cachedOtherBucket.active,
        headValues: cachedOtherBucket.headValues,
        timezone,
      }),
    ),
  };
};

export const barChartDefaultPro = {
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
