import { loadData, OrderBy, Value } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import TablePaginatedChart, {
  TableChartPaginatedProOnRowClickArg,
  TableChartPaginatedProState,
} from './index';
import { mergician } from 'mergician';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';

export const meta = {
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
export const preview = definePreview(TablePaginatedChart, {
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
});

const defaultState: TableChartPaginatedProState = {
  page: 0,
  pageSize: undefined,
  sort: undefined,
  isLoadingDownloadData: false,
  hasTotalResults: true,
};

export default defineComponent(TablePaginatedChart, meta, {
  /* @ts-expect-error - to be fixed in @embeddable.com/react */
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [TableChartPaginatedProState, (state: TableChartPaginatedProState) => void],
  ) => {
    const orderDimensionAndMeasure = inputs.dimensionsAndMeasures.find(
      (x) => x.name === state?.sort?.id,
    );

    const orderBy: OrderBy[] =
      orderDimensionAndMeasure && state?.sort
        ? [
            {
              property: orderDimensionAndMeasure,
              direction: state.sort.direction,
            },
          ]
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

      state: mergician(defaultState, state ?? {}), // Merge with default state
      setState,

      results: state?.pageSize
        ? loadData({
            from: inputs.dataset,
            select: dimensionsAndMeasuresToLoad,
            offset: state.page * state.pageSize,
            limit: state.pageSize,
            orderBy,
          })
        : undefined,
      totalResults: !state?.hasTotalResults
        ? loadData({
            from: inputs.dataset,
            select: dimensionsAndMeasuresToLoad,
            offset: 0,
            limit: 0,
            countRows: true,
          })
        : undefined,
      allResults: state?.isLoadingDownloadData
        ? loadData({
            from: inputs.dataset,
            select: inputs.dimensionsAndMeasures,
            orderBy,
            limit: inputs.maxResults,
          })
        : undefined,
    };
  },
  events: {
    onRowClicked: (rowDimensionValue: TableChartPaginatedProOnRowClickArg) => {
      return {
        rowDimensionValue: rowDimensionValue !== undefined ? rowDimensionValue : Value.noFilter(),
      };
    },
  },
});
