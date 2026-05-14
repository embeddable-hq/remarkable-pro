import { Granularity, Value } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartProOptionsClickArg } from '../lines.types';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { lineChartDefaultPro, LineChartDefaultProState } from '../LineChartDefaultPro/definition';

const meta = {
  ...lineChartDefaultPro.meta,
  name: 'AreaChartPro',
  label: 'Area Chart',
} as const satisfies EmbeddedComponentMeta;

export type AreaChartProState = LineChartDefaultProState;

const previewConfig = {
  xAxis: previewData.dimension,
  measures: [previewData.measure],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = lineChartDefaultPro.results.loadDataArgs;
const loadDataResults = lineChartDefaultPro.results.loadData;

const events = {
  onLineClicked: (value: LineChartProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
  }),
};

const props = (
  inputs: Inputs<typeof meta>,
  [state, setState]: [AreaChartProState, (state: AreaChartProState) => void],
  clientContext: ThemeClientContext,
) => {
  const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

  return {
    ...inputs,
    xAxis: xAxisWithGranularity,
    setGranularity: (granularity: Granularity) => setState({ granularity }),
    results: loadDataResults(inputs, xAxisWithGranularity, clientContext),
  };
};

export const areaChartPro = {
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
} as const;
