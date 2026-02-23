import { DataResponse, LoadDataRequest, OrderBy, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import TablePaginatedChart, {
  TableChartPaginatedProOnRowClickArg,
  TableChartPaginatedProState,
} from './index';
import { mergician } from 'mergician';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'TableChartPaginated',
  label: 'Table Chart - Paginated',
  category: 'Table Charts',
  inputs: [
    inputs.dataset,
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
    hasTotalResults: true,
    hideMenu: true,
  },
  hideMenu: true,
};

const preview = definePreview(TablePaginatedChart, previewConfig);

export const defaultState: TableChartPaginatedProState = {
  page: 0,
  pageSize: undefined,
  sort: undefined,
  isLoadingDownloadData: false,
  hasTotalResults: true,
};

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
  onRowClicked: (rowDimensionValue: TableChartPaginatedProOnRowClickArg) => ({
    rowDimensionValue: rowDimensionValue !== undefined ? rowDimensionValue : Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [TableChartPaginatedProState, (state: TableChartPaginatedProState) => void],
) => {
  const orderDimensionAndMeasure = inputs.dimensionsAndMeasures.find(
    (x) => x.name === state?.sort?.id,
  );

  const orderBy: OrderBy[] =
    orderDimensionAndMeasure && state?.sort
      ? [{ property: orderDimensionAndMeasure, direction: state.sort.direction }]
      : [];

  const clickDimensionInDimensionsAndMeasures = inputs.dimensionsAndMeasures.some(
    (dimOrMeas) => dimOrMeas.name === inputs.clickDimension?.name,
  );

  const dimensionsAndMeasuresToLoad = [
    ...inputs.dimensionsAndMeasures,
    ...(clickDimensionInDimensionsAndMeasures ? [] : [inputs.clickDimension]),
  ];

  return {
    ...inputs,
    state: mergician(defaultState, state ?? {}),
    setState,
    results: state?.pageSize
      ? loadDataResults(inputs, state.page, state.pageSize, orderBy, dimensionsAndMeasuresToLoad)
      : undefined,
    totalResults: !state?.hasTotalResults
      ? loadDataTotalResults(inputs, dimensionsAndMeasuresToLoad)
      : undefined,
    allResults: state?.isLoadingDownloadData ? loadDataAllResults(inputs, orderBy) : undefined,
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
