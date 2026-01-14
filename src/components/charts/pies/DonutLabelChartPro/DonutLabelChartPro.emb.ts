import DonutLabelChartPro from './index';
import { Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import { inputs } from '../../../component.inputs.constants';
import { previewDimension, previewMeasure, previewResults } from '../../../preview.data.constants';

export const meta = {
  name: 'DonutLabelChartPro',
  label: 'Donut Label Chart',
  category: 'Pie Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.dimension,
    { ...inputs.measure, name: 'innerLabelMeasure', label: 'Inner label measure' },
    {
      ...inputs.string,
      name: 'innerLabelText',
      label: 'Inner label text',
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
          label: 'Clicked dimension',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(DonutLabelChartPro, {
  dimension: previewDimension,
  measure: previewMeasure,
  results: previewResults,
  innerLabelText: 'Total',
  resultsInnerLabel: {
    isLoading: false,
    error: undefined,
    data: [{ users: 500 }],
  },
  innerLabelMeasure: {
    name: 'users',
    title: 'Users',
    nativeType: 'number',
    __type__: 'measure',
  },
  showValueLabels: false,
});

export default defineComponent(DonutLabelChartPro, meta, {
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
