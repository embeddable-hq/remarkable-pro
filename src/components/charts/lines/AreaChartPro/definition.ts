import { Granularity, Value } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { LineChartGroupedProOptionsClickArg } from '../lines.types';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { lineChartGroupedPro, LineChartGroupedProState } from '../LineChartGroupedPro/definition';

const meta = {
  ...lineChartGroupedPro.meta,
  name: 'AreaChartPro',
  label: 'Area Chart',
} as const satisfies EmbeddedComponentMeta;

export type AreaChartProState = LineChartGroupedProState;

const previewConfig = {
  xAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = lineChartGroupedPro.results.loadDataArgs;
const loadDataResults = lineChartGroupedPro.results.loadData;

const events = {
  onLineClicked: (value: LineChartGroupedProOptionsClickArg) => ({
    axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
    axisDimensionTimeRange: value.dimensionTimeRange ?? Value.noFilter(),
    groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
    groupingDimensionTimeRange: value.groupingDimensionTimeRange ?? Value.noFilter(),
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
    granularity: state?.granularity,
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
