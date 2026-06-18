import { DataResponse, loadData, LoadDataRequest, TimeRange } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const meta = {
  name: 'KpiChartNumberComparisonPro',
  label: 'Kpi Chart - Number Comparison',
  description:
    'KPI with a delta versus a comparison period. Takes one measure and pairs with a comparison-period variable.',
  category: 'Kpi Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionTime, name: 'timeProperty', label: 'Time property' },
    {
      ...inputs.timeRange,
      name: 'primaryDateRange',
      label: 'Primary date-range',
      description:
        'The comparison period is derived internally using this date range — do not also apply a date filter on the underlying dataset',
      category: 'Component Data',
    },
    {
      ...inputs.comparisonPeriod,
      description: 'You can also connect this to a comparison period selector using its variable',
      category: 'Component Data',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.displayNullAs,
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
      name: 'reversePositiveNegativeColors',
      label: 'Reverse positive/negative colors',
      defaultValue: false,
      category: 'Component Settings',
    },
    inputs.fontSize,
    {
      ...inputs.fontSize,
      name: 'changeFontSize',
      label: 'Trend font-size',
    },
    inputs.menuOptions,
  ],
} as const satisfies EmbeddedComponentMeta;

export type KpiChartNumberComparisonProState = {
  comparisonDateRange: TimeRange;
};

const previewConfig = {
  measure: { ...previewData.measure },
  results: previewData.results1Measure,
  resultsComparison: previewData.results1MeasureVariant,
  primaryDateRange: undefined,
  comparisonPeriod: 'Previous period',
  comparisonDateRange: { relativeTimeString: 'Today', from: undefined, to: undefined },
  fontSize: 100,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure],
  limit: 1,
  timezone: getClientContextTimezone(clientContext?.timezone),
  filters:
    inputs.primaryDateRange && inputs.timeProperty
      ? [
          {
            property: inputs.timeProperty,
            operator: 'inDateRange',
            value: inputs.primaryDateRange,
          },
        ]
      : undefined,
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const loadDataResultsComparisonArgs = (
  inputs: Inputs<typeof meta>,
  comparisonDateRange: TimeRange,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure],
  limit: 1,
  timezone: getClientContextTimezone(clientContext?.timezone),
  filters: [
    {
      property: inputs.timeProperty,
      operator: 'inDateRange',
      value: comparisonDateRange,
    },
  ],
});

const loadDataResultsComparison = (
  inputs: Inputs<typeof meta>,
  state: KpiChartNumberComparisonProState,
  clientContext: ThemeClientContext,
): DataResponse | undefined => {
  if (inputs.primaryDateRange && inputs.timeProperty && state?.comparisonDateRange) {
    return loadData(
      loadDataResultsComparisonArgs(inputs, state.comparisonDateRange, clientContext),
    );
  }
  return undefined;
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    KpiChartNumberComparisonProState,
    (state: KpiChartNumberComparisonProState) => void,
  ],
  clientContext: ThemeClientContext,
) => ({
  ...inputs,
  comparisonPeriod: inputs.comparisonPeriod as string | undefined,
  comparisonDateRange: state?.comparisonDateRange,
  setComparisonDateRange: (comparisonDateRange: TimeRange) => setState({ comparisonDateRange }),
  results: loadDataResults(inputs, clientContext),
  resultsComparison: loadDataResultsComparison(inputs, state, clientContext),
});

export const kpiChartNumberComparisonPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsComparison: {
    loadDataArgs: loadDataResultsComparisonArgs,
    loadData: loadDataResultsComparison,
  },
} as const;
