import { DataResponse, LoadDataRequest, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

const meta = {
  name: 'KpiChartNumberPro',
  label: 'Kpi Chart - Number',
  category: 'Kpi Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.title,
    inputs.description,
    inputs.displayNullAs,
    inputs.tooltip,
    inputs.fontSize,
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  measure: { ...previewData.measure },
  results: previewData.results1Measure,
  fontSize: 100,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (inputs: Inputs<typeof meta>): LoadDataRequest => ({
  from: inputs.dataset,
  select: [inputs.measure],
});

const loadDataResults = (inputs: Inputs<typeof meta>): DataResponse =>
  loadData(loadDataResultsArgs(inputs));

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  results: loadDataResults(inputs),
});

export const kpiChartNumberPro = {
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
