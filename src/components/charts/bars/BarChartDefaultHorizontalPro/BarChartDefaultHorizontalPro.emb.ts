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
import BarChartDefaultHorizontalPro from './index';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'BarChartDefaultHorizontalPro',
  label: 'Bar Chart - Default Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measures,
    { ...inputs.dimensionWithDateBounds, label: 'Y-axis' },
    inputs.title,
    inputs.description,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.yAxisMaxItems,
  ],
  events: [
    {
      name: 'onBarClicked',
      label: 'A bar is clicked',
      properties: [
        {
          name: 'axisDimensionValue',
          label: 'Clicked Axis Dimension Value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(BarChartDefaultHorizontalPro, {
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
  reverseYAxis: false,
  showLogarithmicScale: false,
  showTooltips: false,
  showValueLabels: false,
  yAxisLabel: 'Months',
  xAxisLabel: 'Total sales',
  yAxisMaxItems: 0,
  // @typescript-eslint/no-unused-vars
  onBarClicked: function (): void {
    throw new Error('Function not implemented.');
  },
});

export default defineComponent(BarChartDefaultHorizontalPro, meta, {
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
