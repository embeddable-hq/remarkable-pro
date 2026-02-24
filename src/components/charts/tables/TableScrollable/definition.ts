import { DataResponse, LoadDataRequest, OrderBy, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import TableScrollableChart, {
  TableScrollableProOnRowClickArg,
  TableScrollableProState,
} from './index';
import { mergician } from 'mergician';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'TableScrollable',
  label: 'Table Chart - Scrollable',
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

const previewConfig = {
  dimensionsAndMeasures: [previewData.dimension, previewData.dimensionGroup, previewData.measure],
  results: previewData.results1Measure2Dimensions,
  dataset: previewData.dataset,
  hideMenu: true,
};

const preview = definePreview(TableScrollableChart, previewConfig);

export const defaultTableScrollableState: TableScrollableProState = {
  page: 0,
  sort: undefined,
  isLoadingDownloadData: false,
};

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
  onRowClicked: (rowDimensionValue: TableScrollableProOnRowClickArg) => ({
    rowDimensionValue: rowDimensionValue !== undefined ? rowDimensionValue : Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [TableScrollableProState, (state: TableScrollableProState) => void],
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
    state: mergician(defaultTableScrollableState, state ?? {}),
    setState,
    results: loadDataResults(
      inputs,
      state?.page ? state.page : defaultTableScrollableState.page,
      orderBy,
      dimensionsAndMeasuresToLoad,
    ),
    allResults: loadDataAllResults(inputs, orderBy, state),
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
