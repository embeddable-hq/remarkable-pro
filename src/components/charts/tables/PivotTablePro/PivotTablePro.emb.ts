import { loadData } from '@embeddable.com/core';
import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import PivotTablePro from './index';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';

export const meta = {
  name: 'PivotTablePro',
  label: 'Pivot Table',
  category: 'Table Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      label: 'Measures To Display',
      inputs: [
        ...inputs.measures.inputs,
        {
          ...subInputs.boolean,
          name: 'showColumnTotal',
          label: 'Show Column Total',
        },
        {
          ...subInputs.boolean,
          name: 'showRowTotal',
          label: 'Show Row Total',
        },
        {
          ...subInputs.boolean,
          name: 'showAsPercentage',
          label: 'Show As Percentage',
          description: 'If turned on, other measures may be ignored',
          defaultValue: false,
        },
      ],
    },
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

export default defineComponent(PivotTablePro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,

      results: loadData({
        from: inputs.dataset,
        select: [inputs.rowDimension, inputs.columnDimension, ...inputs.measures],
        limit: inputs.maxResults,
        countRows: true,
      }),
    };
  },
});
