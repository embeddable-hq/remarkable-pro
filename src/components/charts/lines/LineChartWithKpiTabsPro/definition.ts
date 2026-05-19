import { DataResponse, Granularity, LoadDataRequest, Value, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { lineChartDefaultPro, LineChartDefaultProState } from '../LineChartDefaultPro/definition';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { LineChartProOptionsClickArg } from '../lines.types';

const meta = {
  ...lineChartDefaultPro.meta,
  name: 'LineChartWithKpiTabsPro',
  label: 'Line Chart - With Kpi Tabs',
  description:
    'Line chart with clickable KPI tabs above — each measure gets a tab showing its total. One time dimension and one or more measures.',
  defaultHeight: 526,
  defaultWidth: 1280,
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  xAxis: previewData.dimension,
  measures: [previewData.measure, previewData.measureVariant],
  results: previewData.results1Measure1Dimension,
  resultsKpis: previewData.results2Measures,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

// Reuse loadData and loadDataArgs from LineChartDefaultPro for main results,
const loadDataResultsArgs = lineChartDefaultPro.results.loadDataArgs;
const loadDataResults = lineChartDefaultPro.results.loadData;

const loadDataResultsKpisArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [...inputs.measures],
  timezone: getClientContextTimezone(clientContext?.timezone),
});

const loadDataResultsKpis = (
  inputs: Inputs<typeof meta>,
  clientContext: ThemeClientContext,
): DataResponse => loadData(loadDataResultsKpisArgs(inputs, clientContext));

const events = {
  onLineClicked: (value: LineChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [LineChartDefaultProState, (state: LineChartDefaultProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    granularity: state?.granularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, xAxisWithGranularity, clientContext),
    resultsKpis: loadDataResultsKpis(inputs, clientContext),
  };
};

export const lineChartWithKpiTabsPro = {
  Component,
  meta,
  preview,
  previewConfig,
  config: {
    props,
    events,
  },
  results: {
    loadDataArgs: loadDataResultsArgs,
    loadData: loadDataResults,
  },
  resultsKpis: {
    loadDataArgs: loadDataResultsKpisArgs,
    loadData: loadDataResultsKpis,
  },
} as const;
