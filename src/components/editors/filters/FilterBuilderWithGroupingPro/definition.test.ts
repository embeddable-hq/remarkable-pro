import { vi, describe, it, expect } from 'vitest';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import type { FilterBuilderGroupingState } from './FilterBuilderWithGroupingPro.utils';

vi.mock('.', () => ({ default: () => null }));

vi.mock('@embeddable.com/react', () => ({
  definePreview: vi.fn(() => ({ preview: true })),
}));

vi.mock('@embeddable.com/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@embeddable.com/core')>();
  return {
    ...actual,
    loadData: vi.fn((args) => ({ __loadData: args })),
    Value: { noFilter: vi.fn(() => ({ __noFilter: true })) },
  };
});

vi.mock('../../component.inputs.constants', () => ({
  inputs: {
    dataset: { name: 'ds' },
    dimensionsAndMeasures: { name: 'dm', config: {} },
    filters: { name: 'filters' },
    boolean: { name: 'bool' },
    title: { name: 'title' },
    description: { name: 'description' },
    tooltip: { name: 'tooltip' },
  },
}));

import { filterBuilderWithGroupingPro } from './definition';

const dim = (name: string): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType: 'string',
    __type__: 'dimension',
  }) as unknown as DimensionOrMeasure;

describe('filterBuilderWithGroupingPro definition', () => {
  it('registers the correct meta', () => {
    expect(filterBuilderWithGroupingPro.meta.name).toBe('FilterBuilderWithGroupingPro');
    expect(filterBuilderWithGroupingPro.meta.label).toBe('Filter Builder (with grouping)');
    expect(filterBuilderWithGroupingPro.meta.category).toBe('Filters');
  });

  it('builds filterResults for complete dimension leaf filters (incl. nested groups)', () => {
    const state: FilterBuilderGroupingState = {
      operator: 'and',
      items: [
        { id: 1, dimensionOrMeasure: dim('country'), search: '', operator: 'is', value: 'AU' },
        {
          id: 2,
          operator: 'or',
          filters: [
            { id: 3, dimensionOrMeasure: dim('city'), search: '', operator: 'is', value: 'X' },
          ],
        },
      ],
    };
    const setState = vi.fn();
    const inputs = {
      dataset: 'DS',
      dimensionsAndMeasures: [dim('country')],
      applyCascadingFilters: false,
    };

    const result = filterBuilderWithGroupingPro.config.props(inputs as never, [
      state,
      setState,
    ]) as Record<string, unknown>;

    expect(result.embeddableState).toBe(state);
    expect(result.setEmbeddableState).toBe(setState);
    expect(result.filterResults1).toBeDefined();
    expect(result.filterResults3).toBeDefined();
  });

  it('skips filters without an operator', () => {
    const state: FilterBuilderGroupingState = {
      operator: 'and',
      items: [
        { id: 1, dimensionOrMeasure: dim('country'), search: '', operator: null, value: null },
      ],
    };
    const result = filterBuilderWithGroupingPro.config.props(
      { dataset: 'DS', applyCascadingFilters: false } as never,
      [state, vi.fn()],
    ) as Record<string, unknown>;
    expect(result.filterResults1).toBeUndefined();
  });

  it('onChange event wraps the clause, falling back to noFilter', () => {
    const clause = { operator: 'and' as const, clauses: [] };
    expect(filterBuilderWithGroupingPro.config.events.onChange(clause)).toEqual({ value: clause });
    expect(filterBuilderWithGroupingPro.config.events.onChange(null)).toEqual({
      value: { __noFilter: true },
    });
  });
});
