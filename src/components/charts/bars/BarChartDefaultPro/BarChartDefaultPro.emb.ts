import {
  Value,
  loadData,
  mockDataResponse,
  mockDimension,
  mockMeasure,
} from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartDefaultPro from './index';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'BarChartDefaultPro',
  label: 'Bar Chart - Default',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measures,
    { ...inputs.dimensionWithDateBounds, label: 'X-axis' },
    inputs.title,
    inputs.description,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.xAxisMaxItems,
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(BarChartDefaultPro, {
  title: 'Example monthly sales',
  dimension: mockDimension('month', 'string', { title: 'Month' }),
  measures: [mockMeasure('total_sales', 'sum', { title: 'Total Sales' })],
  results: mockDataResponse(
    ['month', 'total_sales'],
    [
      ['January', 45000],
      ['February', 52000],
      ['March', 48000],
      ['April', 61000],
      ['May', 55000],
      ['June', 67000],
    ],
  ),
  showLegend: true,
  description: '',
  reverseXAxis: false,
  showLogarithmicScale: false,
  showTooltips: false,
  showValueLabels: false,
  xAxisLabel: 'Months',
  yAxisLabel: 'Total sales',
  xAxisMaxItems: 0,
  onBarClicked: function (): void {
    throw new Error('Function not implemented.');
  },
});

export default defineComponent(BarChartDefaultPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        from: inputs.dataset,
        select: [...inputs.measures, inputs.dimension],
      }),
    };
  },
  events: {
    onBarClicked: (value) => {
      return {
        axisDimensionValue: value.axisDimensionValue || Value.noFilter(),
      };
    },
  },
});
