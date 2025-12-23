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
      label: 'Row Dimension',
      name: 'rowDimension',
    },
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Column Dimension',
      name: 'columnDimension',
    },
    inputs.title,
    inputs.description,
    inputs.displayNullAs,
    {
      ...inputs.color,
      name: 'maxColor',
      label: 'Max Color',
    },
    {
      ...inputs.color,
      name: 'midColor',
      label: 'Mid Color',
      defaultValue: getStyle('--em-tablechart-heatmap-color', '#FF5400'),
    },
    {
      ...inputs.color,
      name: 'minColor',
      label: 'Min Color',
    },

    {
      ...inputs.string,
      name: 'minThreshold',
      label: 'Max range lower limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.string,
      name: 'maxThreshold',
      label: 'Min range upper limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.boolean,
      name: 'showValues',
      label: 'Show Values',
      defaultValue: true,
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'firstColumnWidth',
      label: 'First Column Width',
      description: 'Set the width in px (e.g. 200)',
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'columnWidth',
      label: 'Column Width',
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
