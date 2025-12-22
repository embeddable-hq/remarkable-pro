import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import KpiChartNumberComparisonPro from './index';
import { loadData, TimeRange } from '@embeddable.com/core';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'KpiChartNumberComparisonPro',
  label: 'Kpi Chart - Number Comparison',
  category: 'Kpi Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionTime, name: 'timeProperty', label: 'Time Property' },
    {
      ...inputs.timeRange,
      name: 'primaryDateRange',
      label: 'Primary Date Range',
      description: 'You can also connect this to a date range selector using its variable',
      category: 'Component Data',
    },
    {
      ...inputs.comparisonPeriod,
      label: 'Comparison Period',
      description: 'You can also connect this to a comparison period selector using its variable',
      category: 'Component Data',
    },
    inputs.title,
    inputs.description,
    {
      ...inputs.boolean,
      name: 'displayChangeAsPercentage',
      label: 'Display Change as %',
      defaultValue: false,
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'percentageDecimalPlaces',
      label: 'Percentage Decimal Places',
      defaultValue: 1,
    },
    {
      ...inputs.boolean,
      name: 'reversePositiveNegativeColors',
      label: 'Reverse Positive/Negative Colors',
      defaultValue: false,
      category: 'Component Settings',
    },
    inputs.fontSize,
    {
      ...inputs.fontSize,
      name: 'changeFontSize',
      label: 'Trend Font Size',
    },
  ],
} as const satisfies EmbeddedComponentMeta;

type KpiChartNumberComparisonProState = {
  comparisonDateRange: TimeRange;
};

export default defineComponent(KpiChartNumberComparisonPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [
      KpiChartNumberComparisonProState,
      (state: KpiChartNumberComparisonProState) => void,
    ],
  ) => {
    return {
      ...inputs,
      comparisonPeriod: inputs.comparisonPeriod as string | undefined,
      comparisonDateRange: state?.comparisonDateRange,
      setComparisonDateRange: (comparisonDateRange: TimeRange) => setState({ comparisonDateRange }),
      results: loadData({
        from: inputs.dataset,
        select: [inputs.measure],
        limit: 1,
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
      }),
      resultsComparison:
        inputs.primaryDateRange && inputs.timeProperty && state?.comparisonDateRange
          ? loadData({
              from: inputs.dataset,
              select: [inputs.measure],
              limit: 1,
              filters: [
                {
                  property: inputs.timeProperty,
                  operator: 'inDateRange',
                  value: state.comparisonDateRange,
                },
              ],
            })
          : undefined,
    };
  },
});
