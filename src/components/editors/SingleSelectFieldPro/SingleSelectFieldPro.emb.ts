import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import { Value, loadData } from '@embeddable.com/core';
import SingleSelectFieldPro, { MAX_OPTIONS } from '.';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

export const meta = {
  name: 'SingleSelectFieldPro',
  label: 'Single Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    { ...inputs.dimension, label: 'Dimension (to load Dropdown values)' },
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select value...' },
    {
      ...inputs.number,
      name: 'maxOptions',
      label: 'Maximum options',
      category: 'Component Settings',
      defaultValue: MAX_OPTIONS,
    },
    {
      ...inputs.string,
      name: 'selectedValue',
      label: 'Selected value',
      category: 'Pre-configured Variables',
    },
    {
      ...inputs.dimension,
      config: {
        dataset: 'dataset',
      },
      required: false,
      name: 'optionalSecondDimension',
      label: 'Optional secondary dimension',
      category: 'Data Mapping for Interactions',
      description: 'Send a different dimension to embeddable when the user clicks. Must be unique.',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Selected value updated',
      properties: [
        {
          name: 'value',
          label: 'Selected value',
          type: 'string',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'single-select value',
      type: 'string',
      defaultValue: Value.noFilter(),
      inputs: ['selectedValue'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

type SingleSelectDropdownState = {
  searchValue?: string;
};

export const preview = definePreview(SingleSelectFieldPro, {
  dimension: previewData.dimension,
  results: previewData.results1Measure1Dimension,
  onChange: () => null,
});

export default defineComponent(SingleSelectFieldPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [SingleSelectDropdownState, (state: SingleSelectDropdownState) => void],
  ) => {
    const operator = inputs.dimension.nativeType === 'string' ? 'contains' : 'equals';
    return {
      ...inputs,
      maxOptions: inputs.maxOptions,
      setSearchValue: (searchValue: string) => setState({ searchValue: searchValue }),
      results: loadData({
        limit: inputs.maxOptions,
        from: inputs.dataset,
        select: [inputs.dimension, inputs.optionalSecondDimension].filter(Boolean),
        filters: state?.searchValue
          ? [
              {
                operator,
                property: inputs.dimension,
                value: state.searchValue,
              },
            ]
          : undefined,
      }),
    };
  },
  events: {
    onChange: (selectedValue: string) => {
      return {
        value: selectedValue ?? Value.noFilter(),
      };
    },
  },
});
