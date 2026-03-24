import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { DimensionOrMeasure, FilterOperator, loadData, Value } from '@embeddable.com/core';
import Component from '.';
import { inputs } from '../../component.inputs.constants';
import { FilterBuilderClause } from './FilterBuilderPro.utils';

const meta = {
  name: 'FilterBuilderPro',
  label: 'Filter Builder',
  category: 'Filters',
  defaultWidth: 300,
  defaultHeight: 80,
  inputs: [inputs.dataset, inputs.dimensionsAndMeasures],
  events: [
    {
      name: 'onChange',
      label: 'Filter value updated',
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
      name: 'filter value',
      type: 'filters',
      defaultValue: {},
      inputs: [],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {});

export type FilterBuilderFilter = {
  id: number;
  dimensionOrMeasure: DimensionOrMeasure | null;
  search: string;
  value: string | string[] | number | number[] | boolean | null;
  operator: string | null;
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
    const operator =
      dimensionOrMeasure.nativeType === 'string' ? FilterOperator.contains : FilterOperator.equals;

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
  onChange: (value: FilterBuilderClause | null) => ({
    value: value ?? Value.noFilter(),
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
