import {
  DataResponse,
  LoadDataRequest,
  OrderBy,
  OrderDirection,
  Value,
  loadData,
} from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import TablePaginatedChart, {
  TableChartPaginatedProOnRowClickArg,
  TableChartPaginatedProState,
} from './index';
import { inputs } from '../../../component.inputs.constants';
import { getSortDirectionValue } from '../../../types/SortDirection.type.emb';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'TableChartPaginated',
  label: 'Table Chart - Paginated',
  description: 'Server-side paginated table. Pick over TableScrollable for large datasets.',
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
      category: 'Data Mapping for Interactions',
      required: false,
    },
    {
      ...inputs.sortDimensionOrMeasure,
      name: 'sortColumn',
      label: 'Default sort column',
      category: 'Component Settings',
    },
    { ...inputs.sortDirection, label: 'Default sort direction', category: 'Component Settings' },
    inputs.menuOptions,
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

const previewMaxResults = 3;

const previewConfig = {
  dimensionsAndMeasures: [previewData.dimension, previewData.dimensionGroup, previewData.measure],
  results: {
    ...previewData.results1Measure2Dimensions,
    data: previewData.results1Measure2Dimensions.data?.slice(0, previewMaxResults),
  },
  totalResults: { data: [], total: previewMaxResults, isLoading: false },
  state: {
    page: 0,
    pageSize: previewMaxResults,
    isLoadingDownloadData: false,
    hideMenu: true,
  },
  hideMenu: true,
};

const preview = definePreview(TablePaginatedChart, previewConfig);

export const defaultTableChartPaginatedState = (
  inputs?: Inputs<typeof meta>,
): TableChartPaginatedProState => ({
  page: 0,
  pageSize: undefined,
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
  pageSize: number,
  orderBy: OrderBy[],
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): LoadDataRequest => ({
  from: inputs.dataset,
  select: dimensionsAndMeasuresToLoad,
  offset: page * pageSize,
  limit: pageSize,
  orderBy,
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  page: number,
  pageSize: number,
  orderBy: OrderBy[],
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): DataResponse =>
  loadData(loadDataResultsArgs(inputs, page, pageSize, orderBy, dimensionsAndMeasuresToLoad));

const loadDataTotalResultsArgs = (
  inputs: Inputs<typeof meta>,
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): LoadDataRequest => ({
  from: inputs.dataset,
  select: dimensionsAndMeasuresToLoad,
  offset: 0,
  limit: 0,
  countRows: true,
});

const loadDataTotalResults = (
  inputs: Inputs<typeof meta>,
  dimensionsAndMeasuresToLoad: Parameters<typeof loadData>[0]['select'],
): DataResponse => loadData(loadDataTotalResultsArgs(inputs, dimensionsAndMeasuresToLoad));

const loadDataAllResultsArgs = (
  inputs: Inputs<typeof meta>,
  orderBy: OrderBy[],
): LoadDataRequest => ({
  from: inputs.dataset,
  select: inputs.dimensionsAndMeasures,
  orderBy,
  limit: inputs.maxResults,
});

const loadDataAllResults = (inputs: Inputs<typeof meta>, orderBy: OrderBy[]): DataResponse =>
  loadData(loadDataAllResultsArgs(inputs, orderBy));

const events = {
  onRowClicked: (value: TableChartPaginatedProOnRowClickArg) => ({
    rowDimensionValue: value.dimensionValue ?? Value.noFilter(),
    rowDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [TableChartPaginatedProState, (state: TableChartPaginatedProState) => void],
) => {
  const mergedState: TableChartPaginatedProState = {
    ...defaultTableChartPaginatedState(inputs),
    ...state,
  };

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
    results: mergedState.pageSize
      ? loadDataResults(
          inputs,
          mergedState.page,
          mergedState.pageSize,
          orderBy,
          dimensionsAndMeasuresToLoad,
        )
      : undefined,
    totalResults: loadDataTotalResults(inputs, dimensionsAndMeasuresToLoad),
    allResults: mergedState.isLoadingDownloadData ? loadDataAllResults(inputs, orderBy) : undefined,
  };
};

export const tableChartPaginated = {
  Component: TablePaginatedChart,
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
  totalResults: {
    loadDataArgs: loadDataTotalResultsArgs,
    loadData: loadDataTotalResults,
  },
  allResults: {
    loadDataArgs: loadDataAllResultsArgs,
    loadData: loadDataAllResults,
  },
} as const;
