import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import LineChartComparisonDefaultPro from './index';
import { Granularity, loadData, OrderBy, TimeRange, Value } from '@embeddable.com/core';
import { LineChartProOptionsClickArg } from '../lines.utils';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'LineChartComparisonDefaultPro',
  label: 'Line Chart Comparison - Default',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      inputs: [
        ...inputs.measures.inputs,
        { ...subInputs.boolean, name: 'fillUnderLine', label: 'Fill under line' },
        {
          ...subInputs.color,
          category: 'Component Settings',
          name: 'lineColor',
          label: 'Line color',
        },
        {
          ...subInputs.color,
          category: 'Component Settings',
          name: 'previousLineColor',
          label: 'Previous line color',
        },
        {
          ...subInputs.boolean,
          name: 'lineDashed',
          label: 'Primary line dashed',
          defaultValue: false,
        },
        {
          ...subInputs.boolean,
          name: 'previousLineDashed',
          label: 'Compared line dashed',
          defaultValue: true,
        },
        {
          ...subInputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
        },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, label: 'X-axis', name: 'xAxis' },
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
    {
      ...inputs.boolean,
      name: 'showComparisonAxis',
      label: 'Display a comparison X-axis',
      defaultValue: true,
      category: 'Component Settings',
    },
    inputs.maxResults,
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(LineChartComparisonDefaultPro, {
  xAxis: previewData.dimension,
  measures: [
    {
      ...previewData.measure,
      inputs: {
        previousLineDashed: true,
      },
    },
  ],
  results: previewData.results1Measure2Dimensions,
  resultsComparison: previewData.results1Measure2DimensionsVariant,
  comparisonPeriod: 'Previous period',
  comparisonDateRange: { relativeTimeString: 'Previous period', from: undefined, to: undefined },
  primaryDateRange: { relativeTimeString: 'This week', from: undefined, to: undefined },
  hideMenu: true,
  setGranularity: () => {},
});

type LineChartComparisonDefaultProState = {
  comparisonDateRange: TimeRange;
  granularity?: Granularity;
};

export default defineComponent(LineChartComparisonDefaultPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [
      LineChartComparisonDefaultProState,
      (state: LineChartComparisonDefaultProState) => void,
    ],
  ) => {
    const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

    const orderBy: OrderBy[] = [
      {
        property: xAxisWithGranularity,
        direction: 'asc',
      },
    ];

    const timeProperty =
      xAxisWithGranularity.nativeType === 'time'
        ? xAxisWithGranularity
        : inputs.timePropertyForNonTimeDimensions;

    return {
      ...inputs,
      xAxis: xAxisWithGranularity,
      setGranularity: (granularity) => setState({ ...state, granularity }),
      comparisonDateRange: state?.comparisonDateRange,
      setComparisonDateRange: (comparisonDateRange: TimeRange) =>
        setState({ ...state, comparisonDateRange }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [...inputs.measures, xAxisWithGranularity],
        orderBy,
        filters:
          inputs.primaryDateRange && timeProperty
            ? [
                {
                  property: timeProperty,
                  operator: 'inDateRange',
                  value: inputs.primaryDateRange,
                },
              ]
            : undefined,
      }),
      resultsComparison:
        inputs.primaryDateRange && timeProperty && state?.comparisonDateRange
          ? loadData({
              limit: inputs.maxResults,
              from: inputs.dataset,
              select: [...inputs.measures, xAxisWithGranularity],
              orderBy,
              filters: [
                {
                  property: timeProperty,
                  operator: 'inDateRange',
                  value: state.comparisonDateRange,
                },
              ],
            })
          : undefined,
    };
  },
  events: {
    onLineClicked: (value: LineChartProOptionsClickArg) => {
      return {
        axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
      };
    },
  },
});
