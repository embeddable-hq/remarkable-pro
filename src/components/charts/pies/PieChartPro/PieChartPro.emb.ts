import { Value, loadData } from '@embeddable.com/core';
import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import PieChartPro from './index';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'PieChartPro',
  label: 'Pie Chart',
  category: 'Pie Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.dimension,
    inputs.title,
    inputs.description,
    inputs.showLegend,
    inputs.maxLegendItems,
    inputs.showTooltips,
    inputs.showValueLabels,
  ],
  events: [
    {
      name: 'onSegmentClick',
      label: 'A segment is clicked',
      properties: [
        {
          name: 'dimensionValue',
          label: 'Clicked dimension',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(PieChartPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        from: inputs.dataset,
        select: [inputs.measure, inputs.dimension],
      }),
    };
  },
  events: {
    onSegmentClick: (value) => {
      return {
        dimensionValue: value.dimensionValue || Value.noFilter(),
      };
    },
  },
});
