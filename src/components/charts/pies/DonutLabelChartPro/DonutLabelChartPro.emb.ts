import DonutChartPro from './index';
import { Value, loadData } from '@embeddable.com/core';
import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'DonutLabelChartPro',
  label: 'Donut Label Chart',
  category: 'Pie Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.dimension,
    { ...inputs.measure, name: 'innerLabelMeasure', label: 'Inner Label Measure' },
    {
      ...inputs.string,
      name: 'innerLabelText',
      label: 'Inner Label Text',
      description: 'Text to display inside the donut chart',
      category: 'Component Data',
    },
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
          label: 'Clicked Dimension',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(DonutChartPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        from: inputs.dataset,
        select: [inputs.measure, inputs.dimension],
      }),
      resultsInnerLabel: loadData({
        from: inputs.dataset,
        select: [inputs.innerLabelMeasure],
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
