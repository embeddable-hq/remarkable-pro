import { loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import PivotTablePro from './index';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';

export const meta = {
  name: 'PivotTablePro',
  label: 'Pivot Table',
  category: 'Table Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      label: 'Measures to display',
      inputs: [
        ...inputs.measures.inputs,
        {
          ...subInputs.boolean,
          name: 'showColumnTotal',
          label: 'Show column total',
        },
        {
          ...subInputs.boolean,
          name: 'showRowTotal',
          label: 'Show row total',
        },
        {
          ...subInputs.boolean,
          name: 'showAsPercentage',
          label: 'Show as percentage',
          description: 'If turned on, other measures may be ignored',
          defaultValue: false,
        },
      ],
    },
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
    inputs.tooltip,
    inputs.displayNullAs,
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

export const preview = definePreview(PivotTablePro, {
  measures: [{ ...previewData.measure, inputs: { showRowTotal: true, showColumnTotal: true } }],
  rowDimension: previewData.dimension,
  columnDimension: previewData.dimensionGroup,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
});

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
