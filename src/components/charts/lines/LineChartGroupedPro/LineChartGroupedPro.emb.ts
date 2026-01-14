import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import LineChartGroupedPro from './index';
import { loadData, Value } from '@embeddable.com/core';
import { LineChartProOptionsClickArg } from '../lines.utils';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'LineChartGroupedPro',
  label: 'Line Chart - Grouped',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measure,
      inputs: [
        ...inputs.measure.inputs,
        {
          ...inputs.boolean,
          name: 'fillUnderLine',
          label: 'Fill under line',
          category: 'Component Settings',
        },
        {
          ...inputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
          category: 'Component Settings',
        },
      ],
    },
    { ...inputs.dimensionWithDateBounds, name: 'xAxis', label: 'X-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
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
        {
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(LineChartGroupedPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [inputs.xAxis, inputs.groupBy, inputs.measure],
      }),
    };
  },
  events: {
    onLineClicked: (value: LineChartProOptionsClickArg) => {
      return {
        axisDimensionValue: value.dimensionValue || Value.noFilter(),
        groupingDimensionValue: value.groupingDimensionValue || Value.noFilter(),
      };
    },
  },
});
