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
) => {
  const filterResults = state?.filters?.reduce<Record<string, unknown>>((acc, item) => {
    if (item.dimensionOrMeasure?.__type__ !== 'dimension' || !item.operator) {
      return acc;
    }

    const { dimensionOrMeasure } = item;
    const operator =
      dimensionOrMeasure.nativeType === 'string' ? FilterOperator.contains : FilterOperator.equals;

    acc[`filterResults${item.id}`] = loadData({
      from: inputs.dataset,
      select: [item.dimensionOrMeasure],
      filters: item.search
        ? [{ operator, property: dimensionOrMeasure, value: item.search }]
        : undefined,
    });
    return acc;
  }, {});

  console.log('filterResults', filterResults);

  return {
    ...inputs,
    embeddableState: state,
    setEmbeddableState: setState,
    dimensionsAndMeasures: inputs.dimensionsAndMeasures ?? [],
    ...filterResults,
  };
};

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
