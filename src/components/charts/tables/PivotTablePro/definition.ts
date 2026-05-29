import { DataResponse, LoadDataRequest, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const meta = {
  name: 'PivotTablePro',
  label: 'Pivot Table',
  description:
    'Cross-tabulated table — row and column dimensions intersected by one or more measures.',
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
    inputs.exportOptions,
  ],
} as const satisfies EmbeddedComponentMeta;

export type PivotTableProState = {
  expandedRowKeys?: string[];
};

const previewConfig = {
  measures: [{ ...previewData.measure, inputs: { showRowTotal: true, showColumnTotal: true } }],
  rowDimension: previewData.dimension,
  columnDimension: previewData.dimensionGroup,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
  expandedRowKeys: [],
  setExpandedRowKey: () => {},
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.rowDimension, inputs.columnDimension, ...inputs.measures],
  limit: inputs.maxResults,
  countRows: true,
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const loadDataResultsSubRowsArgs = (
  inputs: Inputs<typeof meta>,
  expandedRowKeys: string[],
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.rowDimension, inputs.subRowDimension, inputs.columnDimension, ...inputs.measures],
  limit: inputs.maxResults,
  countRows: true,
  timezone: getClientContextTimezone(clientContext?.timezone),
  filters: [
    {
      property: inputs.rowDimension,
      operator: 'equals',
      value: expandedRowKeys,
    },
  ],
});

const loadDataResultsSubRows = (
  inputs: Inputs<typeof meta>,
  expandedRowKeys: string[],
  clientContext?: ThemeClientContext,
): DataResponse | undefined => {
  if (expandedRowKeys.length > 0) {
    return loadData(loadDataResultsSubRowsArgs(inputs, expandedRowKeys, clientContext));
  }
  return undefined;
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [PivotTableProState, (state: PivotTableProState) => void],
  clientContext: ThemeClientContext,
) => {
  const expandedRowKeys = state?.expandedRowKeys ?? [];

  return {
    ...inputs,
    state,
    expandedRowKeys,
    setExpandedRowKey: (rowKey: string) =>
      setState({ expandedRowKeys: [...expandedRowKeys, rowKey] }),
    results: loadDataResults(inputs, clientContext),
    resultsSubRows: loadDataResultsSubRows(inputs, expandedRowKeys, clientContext),
  };
};

export const pivotTablePro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsSubRows: {
    loadDataArgs: loadDataResultsSubRowsArgs,
    loadData: loadDataResultsSubRows,
  },
} as const;
