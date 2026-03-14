import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { DimensionOrMeasure, loadData, LoadDataRequest, Value } from '@embeddable.com/core';
import Component from '.';
import { inputs } from '../../component.inputs.constants';

const meta = {
  name: 'FilterBuilderPro',
  label: 'Filter Builder',
  category: 'Filters',
  defaultWidth: 300,
  defaultHeight: 80,
  inputs: [inputs.dataset, inputs.dimensionsAndMeasures],
  events: [
    {
      name: 'onApply',
      label: 'Apply',
      properties: [
        {
          name: 'value',
          type: 'filters',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'filter builder filters',
      type: 'filters',
      defaultValue: Value.noFilter(),
      inputs: [],
      events: [{ name: 'onApply', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  onApply: () => null,
});

export type FilterBuilderFilter = {
  id: number;
  dimensionOrMeasure: DimensionOrMeasure | null;
  search: string;
  value: string | string[] | number | number[] | boolean | null;
  operator?: string;
};

export type FilterBuilderState = {
  filters: FilterBuilderFilter[];
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [
    FilterBuilderState,
    (state: FilterBuilderState | ((prev: FilterBuilderState) => FilterBuilderState)) => void,
  ],
) => ({
  ...inputs,
  embeddableState: state,
  setEmbeddableState: setState,
  dimensionsAndMeasures: inputs.dimensionsAndMeasures ?? [],
  results: state?.filters?.map((filter) => {
    if (filter.dimensionOrMeasure?.__type__ !== 'dimension') {
      return undefined;
    }

    const { dimensionOrMeasure } = filter;
    const operator = dimensionOrMeasure.nativeType === 'string' ? 'contains' : 'equals';

    return loadData({
      from: inputs.dataset,
      select: [dimensionOrMeasure],
      filters: filter.search
        ? [{ operator, property: dimensionOrMeasure, value: filter.search }]
        : undefined,
    });
  }),
});

const events = {
  onApply: (value: unknown) => ({
    value,
  }),
};

export const filterBuilderPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
