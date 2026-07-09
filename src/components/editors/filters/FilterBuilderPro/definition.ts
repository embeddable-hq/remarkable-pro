import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { FilterOperator, loadData, Value } from '@embeddable.com/core';
import Component from '.';
import { inputs } from '../../../component.inputs.constants';
import {
  FilterBuilderAndOrOperator,
  FilterBuilderClause,
  FilterBuilderFilter,
  filterToLoadDataFilters,
} from './FilterBuilderPro.utils';

export type { FilterBuilderFilter };

const meta = {
  name: 'FilterBuilderPro',
  label: 'Filter Builder',
  description:
    'Free-form filter builder that lets end users compose member/operator/value clauses. Use to expose ad-hoc filtering on a dataset.',
  category: 'Filters',
  defaultWidth: 600,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    {
      ...inputs.dimensionsAndMeasures,
      config: {
        ...inputs.dimensionsAndMeasures.config,
        supportedTypes: ['string', 'number', 'boolean'],
      },
    },
    {
      ...inputs.filters,
      name: 'defaultFilters',
      label: 'Default filters',
      defaultValue: null,
    },
    {
      ...inputs.boolean,
      name: 'applyCascadingFilters',
      label: 'Apply dynamic filters',
      defaultValue: false,
      category: 'Component Settings',
      description: "Each filter's available options update based on the other active filters.",
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
  ],
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
      inputs: ['defaultFilters'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {});

export type FilterBuilderState = {
  filters: FilterBuilderFilter[];
  operator: FilterBuilderAndOrOperator;
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
    const searchOperator =
      dimensionOrMeasure.nativeType === 'string' ? FilterOperator.contains : FilterOperator.equals;

    const searchFilter = item.search
      ? [{ operator: searchOperator, property: dimensionOrMeasure, value: item.search }]
      : [];

    const cascadingFilters = inputs.applyCascadingFilters
      ? (state.filters ?? [])
          .filter((other) => other.id !== item.id)
          .flatMap(filterToLoadDataFilters)
      : [];

    const filters = [...cascadingFilters, ...searchFilter];

    acc[`filterResults${item.id}`] = loadData({
      from: inputs.dataset,
      select: [item.dimensionOrMeasure],
      filters: filters.length > 0 ? filters : undefined,
    });
    return acc;
  }, {});

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
