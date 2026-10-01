import { DataResponse, LoadDataRequest, loadData } from '@embeddable.com/core';
import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { ThemeClientContext } from '../../../../theme/theme.types';
import { getClientContextTimezone } from '../../../../theme/utils/clientContext.utils';
import PositionType, { PositionTypeOptions } from '../../../types/Position.type.emb';

const meta = {
  name: 'FunnelChartPro',
  label: 'Funnel Chart',
  description: 'Funnel chart for a count over an ordered set of stages, e.g. a severity pyramid.',
  category: 'Charts',
  defaultHeight: 442,
  defaultWidth: 630,
  inputs: [
    inputs.dataset,
    {
      ...inputs.dimension,
      name: 'stageDimension',
      label: 'Stage',
      description: 'The column that identifies each funnel stage, e.g. severity_level',
    },
    {
      ...inputs.measure,
      name: 'countMeasure',
      label: 'Count',
      description: 'The measure that counts events at each stage',
    },
    {
      ...inputs.dimension,
      name: 'orderDimension',
      label: 'Order (optional)',
      required: false,
      description:
        'Optional numeric dimension that defines stage order (ascending). When set, overrides the default descending-by-count order, e.g. severity_order INTEGER.',
    },
    {
      ...inputs.color,
      name: 'startColor',
      label: 'Start color (lowest stage)',
      description: 'Color for the lowest stage. Leave blank to auto-generate from the end color.',
    },
    {
      ...inputs.color,
      name: 'endColor',
      label: 'End color (highest stage)',
      description:
        'Color for the highest stage. Leave blank to auto-generate from the start color.',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    {
      ...inputs.boolean,
      name: 'showStageLabels',
      label: 'Show stage names on slices',
      defaultValue: false,
      category: 'Component Settings',
    },
    {
      ...inputs.displayPercentages,
      description: 'Show percentage of total instead of the raw count on each stage.',
    },
    {
      name: 'shrinkAnchor',
      type: PositionType,
      label: 'Shrink anchor',
      description:
        'Where each stage tapers from. "Middle" keeps area roughly proportional when stages are sorted by value. If stages use a custom sort order (e.g. by severity), any anchor except "None" can still make a stage look bigger or smaller than its true share — use "None" for exact proportionality, at the cost of the tapered funnel look.',
      defaultValue: PositionTypeOptions.middle,
      category: 'Component Settings',
    },
    {
      name: 'shrinkFraction',
      type: 'number',
      label: 'Shrink fraction',
      description: 'How much each stage tapers, from 0 (no taper) to 1 (full taper).',
      defaultValue: 1,
      category: 'Component Settings',
    },
    inputs.menuOptions,
  ],
} as const satisfies EmbeddedComponentMeta;

const previewConfig = {
  stageDimension: previewData.dimension,
  countMeasure: previewData.measure,
  displayPercentages: false,
  showLegend: true,
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
};

const preview = definePreview(Component, previewConfig);

const loadDataResultsArgs = (
  inputs: Inputs<typeof meta>,
  clientContext?: ThemeClientContext,
): LoadDataRequest => ({
  from: inputs.dataset,
  select: [
    inputs.stageDimension,
    inputs.countMeasure,
    ...(inputs.orderDimension ? [inputs.orderDimension] : []),
  ],
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

export const funnelChartPro = {
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
