import { Granularity, Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartGroupedHorizontalPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'BarChartGroupedHorizontalPro',
  label: 'Bar Chart - Grouped Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'yAxis', label: 'Y-axis' },
    { ...inputs.dimension, name: 'groupBy', label: 'Group by' },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, defaultValue: false },
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
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
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(BarChartGroupedHorizontalPro, {
  yAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
  setGranularity: () => {},
});

type BarChartGroupedHorizontalProState = {
  granularity?: Granularity;
};

export default defineComponent(BarChartGroupedHorizontalPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [
      BarChartGroupedHorizontalProState,
      (state: BarChartGroupedHorizontalProState) => void,
    ],
  ) => {
    const yAxisWithGranularity = getDimensionWithGranularity(inputs.yAxis, state?.granularity);

    return {
      ...inputs,
      yAxis: yAxisWithGranularity,
      setGranularity: (granularity) => setState({ granularity }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [yAxisWithGranularity, inputs.groupBy, inputs.measure],
      }),
    };
  },
  events: {
    onBarClicked: (value) => {
      return {
        axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
        groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
      };
    },
  },
});
