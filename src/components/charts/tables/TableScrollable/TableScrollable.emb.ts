import { loadData, OrderBy, Value } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import TableScrollableChart, {
  TableScrollableProOnRowClickArg,
  TableScrollableProState,
} from './index';
import { mergician } from 'mergician';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { previewData } from '../../../preview.data.constants';

export const meta = {
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

export const preview = definePreview(TableScrollableChart, {
  dimensionsAndMeasures: [previewData.dimension, previewData.dimensionGroup, previewData.measure],
  results: previewData.results1Measure2Dimensions,
  dataset: previewData.dataset,
  hideMenu: true,
});

const defaultState: TableScrollableProState = {
  page: 0,
  sort: undefined,
  isLoadingDownloadData: false,
};

export default defineComponent(TableScrollableChart, meta, {
  /* @ts-expect-error - to be fixed in @embeddable.com/react */
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [TableScrollableProState, (state: TableScrollableProState) => void],
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

      results: loadData({
        from: inputs.dataset,
        select: dimensionsAndMeasuresToLoad,
        offset: (state?.page ? state.page : defaultState.page) * TABLE_SCROLLABLE_SIZE,
        limit: TABLE_SCROLLABLE_SIZE,
        orderBy,
      }),

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
    onRowClicked: (rowDimensionValue: TableScrollableProOnRowClickArg) => {
      return {
        rowDimensionValue: rowDimensionValue !== undefined ? rowDimensionValue : Value.noFilter(),
      };
    },
  },
});
