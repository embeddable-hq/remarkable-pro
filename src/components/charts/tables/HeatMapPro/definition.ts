import { DataResponse, LoadDataRequest, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';

const meta = {
  name: 'HeatMapPro',
  label: 'Heat Map',
  category: 'Table Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Row dimension',
      name: 'rowDimension',
    },
    {
      ...inputs.dimensionWithDateBounds,
      label: 'Column dimension',
      name: 'columnDimension',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.displayNullAs,
    {
      ...inputs.color,
      name: 'midColor',
      label: 'Mid-point color (optional)',
    },
    {
      ...inputs.color,
      name: 'maxColor',
      label: 'Max-point color (optional)',
    },
    {
      ...inputs.color,
      name: 'minColor',
      label: 'Min-point color (optional)',
    },
    {
      ...inputs.string,
      name: 'minThreshold',
      label: 'Max-point range lower limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.string,
      name: 'maxThreshold',
      label: 'Min-point range upper limit',
      description: 'Enter a value as either a number (e.g. 20) or a percentage (e.g. 20%)',
      category: 'Component Settings',
    },
    {
      ...inputs.boolean,
      name: 'showValues',
      label: 'Show values',
      defaultValue: true,
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'firstColumnWidth',
      label: 'First column width',
      description: 'Set the width in px (e.g. 200)',
      category: 'Component Settings',
    },
    {
      ...inputs.number,
      name: 'columnWidth',
      label: 'Column width',
      description: 'Set the width in px (e.g. 200)',
      category: 'Component Settings',
    },
    inputs.maxResults,
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  rowDimension: previewData.dimension,
  columnDimension: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.rowDimension, inputs.columnDimension, inputs.measure],
  limit: inputs.maxResults,
  countRows: true,
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const props = (
  inputs: Inputs<typeof meta>,
  _state: unknown,
  clientContext?: ThemeClientContext,
) => ({
  ...inputs,
  results: loadDataResults(inputs, clientContext),
});

export const heatMapPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
} as const;
