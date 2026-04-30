import {
  Dimension,
  Granularity,
  LoadDataRequest,
  TimeRange,
  Value,
  loadData,
} from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartProOptionsClickArg } from '../lines.types';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import {
  lineChartComparisonDefaultPro,
  LineChartComparisonDefaultProMeasuresInput,
  LineChartComparisonDefaultProState,
} from '../LineChartComparisonDefaultPro/definition';

const meta = {
  ...lineChartComparisonDefaultPro.meta,
  name: 'LineChartComparisonWithKpiTabsPro',
  label: 'Line Chart Comparison - With KPI Tabs',
  inputs: [
    ...lineChartComparisonDefaultPro.meta.inputs.map((input) => {
      if (input.name === 'measures') {
        const measuresInput = input as LineChartComparisonDefaultProMeasuresInput;
        return {
          ...measuresInput,
          inputs: [
            ...measuresInput.inputs,
            {
              ...subInputs.boolean,
              name: 'invertChangeColors',
              label: 'Reverse positive/negative colors',
              defaultValue: false,
            },
            {
              ...subInputs.boolean,
              name: 'displayChangeAsPercentage',
              label: 'Display change as %',
              defaultValue: false,
            },
            {
              ...subInputs.number,
              name: 'percentageDecimalPlaces',
              label: 'Percentage decimal places',
              defaultValue: 1,
            },
          ],
        };
      }
      return input;
    }),
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

const loadDataResults = lineChartComparisonDefaultPro.results.loadData;
const loadDataResultsComparison = lineChartComparisonDefaultPro.resultsComparison.loadData;

const loadDataResultsKpisArgs = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  clientContext?: ThemeClientContext,
): LoadDataRequest => {
  const timeProperty =
    xAxis.nativeType === 'time' ? xAxis : inputs.timePropertyForNonTimeDimensions;
  return {
    from: inputs.dataset,
    select: [...inputs.measures],
    filters:
      inputs.primaryDateRange && timeProperty
        ? [{ property: timeProperty, operator: 'inDateRange', value: inputs.primaryDateRange }]
        : undefined,
    timezone: getClientContextTimezone(clientContext?.timezone),
  };
};

const loadDataResultsKpis = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  clientContext: ThemeClientContext,
) => loadData(loadDataResultsKpisArgs(inputs, xAxis, clientContext));

const loadDataResultsKpisComparisonArgs = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  comparisonDateRange: TimeRange,
  clientContext: ThemeClientContext,
): LoadDataRequest => {
  const timeProperty =
    xAxis.nativeType === 'time' ? xAxis : inputs.timePropertyForNonTimeDimensions;
  return {
    from: inputs.dataset,
    select: [...inputs.measures],
    filters: [{ property: timeProperty, operator: 'inDateRange', value: comparisonDateRange }],
    timezone: getClientContextTimezone(clientContext?.timezone),
  };
};

const loadDataResultsKpisComparison = (
  inputs: Inputs<typeof meta>,
  xAxis: Dimension,
  state: LineChartComparisonWithKpiTabsProState,
  clientContext: ThemeClientContext,
) => {
  const timeProperty =
    xAxis.nativeType === 'time' ? xAxis : inputs.timePropertyForNonTimeDimensions;
  if (inputs.primaryDateRange && timeProperty && state?.comparisonDateRange) {
    return loadData(
      loadDataResultsKpisComparisonArgs(inputs, xAxis, state.comparisonDateRange, clientContext),
    );
  }
  return undefined;
};

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
    resultsKpis: loadDataResultsKpis(inputs, xAxisWithGranularity, clientContext),
    resultsKpisComparison: loadDataResultsKpisComparison(
      inputs,
      xAxisWithGranularity,
      state,
      clientContext,
    ),
  };
};

export const lineChartComparisonWithKpiTabsPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: { props, events },
  results: lineChartComparisonDefaultPro.results,
  resultsComparison: lineChartComparisonDefaultPro.resultsComparison,
  resultsKpis: {
    loadDataArgs: loadDataResultsKpisArgs,
    loadData: loadDataResultsKpis,
  },
  resultsKpisComparison: {
    loadDataArgs: loadDataResultsKpisComparisonArgs,
    loadData: loadDataResultsKpisComparison,
  },
} as const;
