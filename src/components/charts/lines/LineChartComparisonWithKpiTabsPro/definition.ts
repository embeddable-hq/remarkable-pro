import { Granularity, TimeRange, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartProOptionsClickArg } from '../lines.types';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import {
  lineChartComparisonDefaultPro,
  LineChartComparisonDefaultProState,
} from '../LineChartComparisonDefaultPro/definition';

const meta = {
  ...lineChartComparisonDefaultPro.meta,
  name: 'LineChartComparisonWithKpiTabsPro',
  label: 'Line Chart Comparison - With KPI Tabs',
  inputs: [
    ...lineChartComparisonDefaultPro.meta.inputs,
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

export type LineChartComparisonWithKpiTabsProState = LineChartComparisonDefaultProState;

const previewConfig = {
  xAxis: previewData.dimension,
  measures: [previewData.measure, previewData.measureVariant],
  results: previewData.results2Measures1Dimension,
  resultsComparison: previewData.results2Measures1Dimension,
  resultsKpis: previewData.results2Measures,
  resultsKpisComparison: previewData.results2MeasuresVariant,
  comparisonPeriod: 'Previous period',
  comparisonDateRange: { relativeTimeString: 'Previous period', from: undefined, to: undefined },
  primaryDateRange: { relativeTimeString: 'This week', from: undefined, to: undefined },
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

// Reuse loadData helpers from LineChartComparisonDefaultPro
const loadDataResults = lineChartComparisonDefaultPro.results.loadData;
const loadDataResultsComparison = lineChartComparisonDefaultPro.resultsComparison.loadData;

const events = {
  onLineClicked: (value: LineChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    LineChartComparisonWithKpiTabsProState,
    (state: LineChartComparisonWithKpiTabsProState) => void,
  ],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);
  const timeProperty =
    xAxisWithGranularity.nativeType === 'time'
      ? xAxisWithGranularity
      : inputs.timePropertyForNonTimeDimensions;
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
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ ...state, granularity }),
    comparisonDateRange: state?.comparisonDateRange,
    setComparisonDateRange: (comparisonDateRange: TimeRange) =>
      setState({ ...state, comparisonDateRange }),
    results: loadDataResults(inputs as never, xAxisWithGranularity, clientContext),
    resultsComparison: loadDataResultsComparison(
      inputs as never,
      xAxisWithGranularity,
      state,
      clientContext,
    ),
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
              {
                property: timeProperty,
                operator: 'inDateRange' as const,
                value: state.comparisonDateRange,
              },
            ],
            timezone,
          })
        : undefined,
  };
};

export const lineChartComparisonWithKpiTabsPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: { props, events },
} as const;
