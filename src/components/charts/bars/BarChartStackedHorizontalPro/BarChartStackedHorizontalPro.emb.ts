import { Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartStackedHorizontalPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

export const meta = {
  name: 'BarChartStackedHorizontalPro',
  label: 'Bar Chart - Stacked Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithDateBounds, name: 'yAxis', label: 'Y-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
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
    inputs.showTotalLabels,
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

export const preview = definePreview(BarChartStackedHorizontalPro, {
  yAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
});

export default defineComponent(BarChartStackedHorizontalPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [inputs.yAxis, inputs.groupBy, inputs.measure],
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
