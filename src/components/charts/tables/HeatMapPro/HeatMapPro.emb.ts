import { loadData } from '@embeddable.com/core';
import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import HeatMapPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { getStyle } from '@embeddable.com/remarkable-ui';

export const meta = {
  name: 'HeatMapPro',
  label: 'Heat Map',
  category: 'Table Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Row dimension',
      name: 'rowDimension',
    },
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Column dimension',
      name: 'columnDimension',
    },
    inputs.title,
    inputs.description,
    inputs.displayNullAs,
    {
      ...inputs.color,
      required: true,
      name: 'midColor',
      label: 'Mid-point color',
      defaultValue: getStyle('--em-tablechart-heatmap-color', '#FF5400'),
    },
    {
      ...inputs.color,
      name: 'maxColor',
      label: 'Max-point color (optional)',
    },
    {
      ...inputs.color,
      name: 'minColor',
      label: 'Min-point color (optional)',
    },

    {
      ...inputs.string,
      name: 'minThreshold',
      label: 'Max-point range lower limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.string,
      name: 'maxThreshold',
      label: 'Min-point range upper limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.boolean,
      name: 'showValues',
      label: 'Show values',
      defaultValue: true,
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'firstColumnWidth',
      label: 'First column width',
      description: 'Set the width in px (e.g. 200)',
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'columnWidth',
      label: 'Column width',
      description: 'Set the width in px (e.g. 200)',
      category: 'Component Settings',
    },
    inputs.maxResults,
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(HeatMapPro, meta, {
  /* @ts-expect-error - to be fixed in @embeddable.com/react */
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        from: inputs.dataset,
        select: [inputs.rowDimension, inputs.columnDimension, inputs.measure],
        limit: inputs.maxResults,
        countRows: true,
      }),
    };
  },
});
