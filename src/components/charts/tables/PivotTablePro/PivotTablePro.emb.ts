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
      label: 'Column dimension',
      name: 'columnDimension',
    },
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Primary row dimension',
      name: 'rowDimension',
    },
    {
      ...inputs.dimension,
      label: 'Secondary row dimension (optional)',
      name: 'subRowDimension',
      required: false,
      description:
        'When set, each primary row becomes expandable. Clicking a row loads a breakdown by the second dimension.',
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
  expandedRowKeys: [],
  setExpandedRowKey: () => {},
});

export type PivotTableProState = {
  expandedRowKeys?: string[];
};

export default defineComponent(PivotTablePro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [PivotTableProState, (state: PivotTableProState) => void],
  ) => {
    const expandedRowKeys = state?.expandedRowKeys ?? [];

    return {
      ...inputs,
      state,
      expandedRowKeys,
      setExpandedRowKey: (rowKey: string) =>
        setState({ expandedRowKeys: [...expandedRowKeys, rowKey] }),
      results: loadData({
        from: inputs.dataset,
        select: [inputs.rowDimension, inputs.columnDimension, ...inputs.measures],
        limit: inputs.maxResults,
        countRows: true,
      }),
      resultsSubRows:
        expandedRowKeys.length > 0
          ? loadData({
              from: inputs.dataset,
              select: [
                inputs.rowDimension,
                inputs.subRowDimension,
                inputs.columnDimension,
                ...inputs.measures,
              ],
              limit: inputs.maxResults,
              countRows: true,
              filters: [
                {
                  property: inputs.rowDimension,
                  operator: 'equals',
                  value: expandedRowKeys,
                },
              ],
            })
          : undefined,
    };
  },
});
