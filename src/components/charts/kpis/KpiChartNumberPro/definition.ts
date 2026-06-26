import { DataResponse, LoadDataRequest, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';

const meta = {
  name: 'KpiChartNumberPro',
  label: 'Kpi Chart - Number',
  description:
    'Single big-number KPI showing one measure. Use for headline metrics without comparison.',
  category: 'Kpi Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.title,
    inputs.description,
    inputs.displayNullAs,
    inputs.tooltip,
    inputs.fontSize,
    inputs.menuOptions,
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  measure: { ...previewData.measure },
  results: previewData.results1Measure,
  fontSize: 100,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => {
  return {
    from: inputs.dataset,
    select: [inputs.measure],
    timezone: getClientContextTimezone(clientContext?.timezone),
  };
};

const loadDataResults = (
  inputs: Inputs<typeof meta>,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsArgs(inputs, clientContext));

const props = (
  inputs: Inputs<typeof meta>,
  _state: unknown,
  clientContext: ThemeClientContext,
) => ({
  ...inputs,
  results: loadDataResults(inputs, clientContext),
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
