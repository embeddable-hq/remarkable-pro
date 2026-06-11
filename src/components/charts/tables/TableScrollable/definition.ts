import {
  DataResponse,
  LoadDataRequest,
  OrderBy,
  OrderDirection,
  Value,
  loadData,
} from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import TableScrollableChart, {
  TableScrollableProOnRowClickArg,
  TableScrollableProState,
} from './index';
import { inputs } from '../../../component.inputs.constants';
import { getSortDirectionValue } from '../../../types/SortDirection.type.emb';
import { subInputs } from '../../../component.subinputs.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'TableScrollable',
  label: 'Table Chart - Scrollable',
  description: 'Scrollable table that loads all rows at once. Pick for small or medium datasets.',
  category: 'Table Charts',
  inputs: [
    { ...inputs.dataset, config: { hideSort: true } },
    {
      ...inputs.dimensionsAndMeasures,
      label: 'Columns',
      inputs: [
        ...inputs.dimensionsAndMeasures.inputs,
        subInputs.width,
        subInputs.align,
        subInputs.displayFormat,
        subInputs.tableCellStyle,
      ],
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    {
      ...inputs.boolean,
      name: 'showIndex',
      label: 'Show index column',
      defaultValue: true,
      category: 'Component Settings',
    },
    inputs.displayNullAs,
    { ...inputs.maxResults, label: 'Max results to download' },
    {
      ...inputs.dimensionSimple,
      label: 'Dimension to set on click',
      name: 'clickDimension',
      category: 'Data mapping for interactions',
      required: false,
    },
    {
      ...inputs.sortDimensionOrMeasure,
      name: 'sortColumn',
      label: 'Default sort column',
      category: 'Component Settings',
    },
    { ...inputs.sortDirection, label: 'Default sort direction', category: 'Component Settings' },
    { ...inputs.exportOptions, defaultValue: ['csv', 'xlsx'] },
  ],
  events: [
    {
      name: 'onRowClicked',
      label: 'A row is clicked',
      properties: [
        {
          name: 'rowDimensionValue',
          label: 'Clicked row dimension value',
          type: 'string',
        },
        {
          name: 'rowDimensionTimeRange',
          label: 'Clicked row dimension time range',
          type: 'timeRange',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  dimensionsAndMeasures: [previewData.dimension, previewData.dimensionGroup, previewData.measure],
  results: previewData.results1Measure2Dimensions,
  dataset: previewData.dataset,
  hideMenu: true,
};

const preview = definePreview(TableScrollableChart, previewConfig);

export const defaultTableScrollableState = (
  inputs?: Inputs<typeof meta>,
): TableScrollableProState => ({
  page: 0,
  sort: inputs?.sortColumn
    ? {
        id: inputs.sortColumn.name,
        direction: getSortDirectionValue(inputs.sortDirection as OrderDirection) ?? 'asc',
      }
    : undefined,
  isLoadingDownloadData: false,
});

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  page: number,
  orderBy: OrderBy[],
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): LoadDataRequest => ({
  from: inputs.dataset,
  select: dimensionsAndMeasuresToLoad,
  offset: page * TABLE_SCROLLABLE_SIZE,
  limit: TABLE_SCROLLABLE_SIZE,
  orderBy,
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  page: number,
  orderBy: OrderBy[],
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): DataResponse =>
  loadData(loadDataResultsArgs(inputs, page, orderBy, dimensionsAndMeasuresToLoad));

const loadDataAllResultsArgs = (
  inputs: Inputs<typeof meta>,
  orderBy: OrderBy[],
): LoadDataRequest => ({
  from: inputs.dataset,
  select: inputs.dimensionsAndMeasures,
  orderBy,
  limit: inputs.maxResults,
});

const loadDataAllResults = (
  inputs: Inputs<typeof meta>,
  orderBy: OrderBy[],
  state: TableScrollableProState,
): DataResponse | undefined => {
  if (state?.isLoadingDownloadData) {
    return loadData(loadDataAllResultsArgs(inputs, orderBy));
  }
  return undefined;
};

const events = {
  onRowClicked: (value: TableScrollableProOnRowClickArg) => ({
    rowDimensionValue: value.dimensionValue ?? Value.noFilter(),
    rowDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [TableScrollableProState, (state: TableScrollableProState) => void],
) => {
  const mergedState: TableScrollableProState = { ...defaultTableScrollableState(inputs), ...state };

  const sortColumn =
    inputs.dimensionsAndMeasures.find((x) => x.name === mergedState.sort?.id) ??
    (inputs.sortColumn?.name === mergedState.sort?.id ? inputs.sortColumn : undefined);
  const orderBy: OrderBy[] =
    sortColumn && mergedState.sort
      ? [{ property: sortColumn, direction: mergedState.sort.direction }]
      : [];

  const hasClickDimension = inputs.dimensionsAndMeasures.some(
    (col) => col.name === inputs.clickDimension?.name,
  );

  const dimensionsAndMeasuresToLoad = [
    ...inputs.dimensionsAndMeasures,
    ...(inputs.clickDimension && !hasClickDimension ? [inputs.clickDimension] : []),
  ];

  return {
    ...inputs,
    state: mergedState,
    setState,
    results: loadDataResults(inputs, mergedState.page, orderBy, dimensionsAndMeasuresToLoad),
    allResults: loadDataAllResults(inputs, orderBy, mergedState),
  };
};

export const tableScrollable = {
  Component: TableScrollableChart,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  allResults: {
    loadDataArgs: loadDataAllResultsArgs,
    loadData: loadDataAllResults,
  },
} as const;
