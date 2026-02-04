import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import KpiChartNumberComparisonPro from './index';
import { loadData, TimeRange } from '@embeddable.com/core';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

export const meta = {
  name: 'KpiChartNumberComparisonPro',
  label: 'Kpi Chart - Number Comparison',
  category: 'Kpi Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionTime, name: 'timeProperty', label: 'Time property' },
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
    inputs.title,
    inputs.description,
    inputs.tooltip,
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
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(KpiChartNumberComparisonPro, {
  measure: { ...previewData.measure },
  results: previewData.results1Measure,
  resultsComparison: previewData.results1MeasureVariant,
  primaryDateRange: undefined,
  comparisonPeriod: 'Previous period',
  comparisonDateRange: { relativeTimeString: 'Today', from: undefined, to: undefined },
  fontSize: 100,
  hideMenu: true,
});

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
