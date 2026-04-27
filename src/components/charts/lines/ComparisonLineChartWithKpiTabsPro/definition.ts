import { Dimension, Granularity, TimeRange, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartProOptionsClickArg } from '../lines.utils';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { lineChartWithKpiTabsPro } from '../LineChartWithKpiTabsPro/definition';

const meta = {
  ...lineChartWithKpiTabsPro.meta,
  name: 'ComparisonLineChartWithKpiTabsPro',
  label: 'Line Chart Comparison - With Kpi Tabs',
  inputs: [
    ...lineChartWithKpiTabsPro.meta.inputs,
    {
      ...inputs.timeRange,
      name: 'primaryDateRange',
      label: 'Primary date-range',
      description: 'You can also connect this to a date range selector using its variable',
      category: 'Component Data',
    },
    {
      ...inputs.comparisonPeriod,
      description: 'You can also connect this to a comparison period selector using its variable',
      category: 'Component Data',
    },
    {
      ...inputs.dimensionTime,
      name: 'timePropertyForNonTimeDimensions',
      label: 'Time property for non time dimensions',
      description:
        'Choose the time property used for filtering comparison ranges. This will be ignored if your x-axis is already time-based.',
      required: false,
    },
    {
      ...inputs.boolean,
      name: 'displayChangeAsPercentage',
      label: 'Display change as %',
      defaultValue: false,
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'percentageDecimalPlaces',
      label: 'Percentage decimal places',
      defaultValue: 1,
      category: 'Component Settings',
    },
    {
      ...inputs.boolean,
      name: 'invertChangeColors',
      label: 'Reverse positive/negative colors',
      defaultValue: false,
      category: 'Component Settings',
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export type ComparisonLineChartWithKpiTabsProState = {
  comparisonDateRange: TimeRange;
  granularity?: Granularity;
};

const previewConfig = {
  xAxis: previewData.dimension,
  measures: [previewData.measure, previewData.measureVariant],
  results: previewData.results2Measures1Dimension,
  resultsKpis: previewData.results2Measures,
  resultsKpisComparison: previewData.results2MeasuresVariant,
  comparisonPeriod: 'Previous period',
  comparisonDateRange: { relativeTimeString: 'Previous period', from: undefined, to: undefined },
  primaryDateRange: { relativeTimeString: 'This week', from: undefined, to: undefined },
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const getTimeProperty = (xAxis: Dimension, timePropertyForNonTimeDimensions?: Dimension) =>
  xAxis.nativeType === 'time' ? xAxis : timePropertyForNonTimeDimensions;

const events = {
  onLineClicked: (value: LineChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    ComparisonLineChartWithKpiTabsProState,
    (state: ComparisonLineChartWithKpiTabsProState) => void,
  ],
  clientContext: ThemeClientContext,
) => {
  const xAxis = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const timeProperty = getTimeProperty(xAxis, inputs.timePropertyForNonTimeDimensions);
  const timezone = getClientContextTimezone(clientContext?.timezone);
  const primaryFilter =
    inputs.primaryDateRange && timeProperty
      ? [
          {
            property: timeProperty,
            operator: 'inDateRange' as const,
            value: inputs.primaryDateRange,
          },
        ]
      : undefined;

  return {
    ...inputs,
    xAxis,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    comparisonDateRange: state?.comparisonDateRange,
    setComparisonDateRange: (comparisonDateRange: TimeRange) =>
      setState({ ...state, comparisonDateRange }),
    results: loadData({
      limit: inputs.maxResults,
      from: inputs.dataset,
      select: [...inputs.measures, xAxis],
      orderBy: [{ property: xAxis, direction: 'asc' }],
      filters: primaryFilter,
      timezone,
    }),
    resultsKpis: loadData({
      from: inputs.dataset,
      select: [...inputs.measures],
      filters: primaryFilter,
      timezone,
    }),
    resultsKpisComparison:
      inputs.primaryDateRange && timeProperty && state?.comparisonDateRange
        ? loadData({
            from: inputs.dataset,
            select: [...inputs.measures],
            filters: [
              { property: timeProperty, operator: 'inDateRange', value: state.comparisonDateRange },
            ],
            timezone,
          })
        : undefined,
  };
};

export const comparisonLineChartWithKpiTabsPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: { props, events },
} as const;
