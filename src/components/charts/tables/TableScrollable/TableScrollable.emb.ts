import { loadData, OrderBy, Value } from '@embeddable.com/core';
import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import TablePaginatedChart, {
  TableScrollableProOnRowClickArg,
  TableScrollableProState,
} from './index';
import { mergician } from 'mergician';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';

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

    {
      ...inputs.boolean,
      name: 'showIndex',
      label: 'Show Index Column',
      defaultValue: true,
      category: 'Component Settings',
    },
    inputs.displayNullAs,
    { ...inputs.maxResults, label: 'Max Results to Download' },
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
          label: 'Clicked Row Dimension Value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const defaultState: TableScrollableProState = {
  page: 0,
  sort: undefined,
  isLoadingDownloadData: false,
};

export default defineComponent(TablePaginatedChart, meta, {
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
