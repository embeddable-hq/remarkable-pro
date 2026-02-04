import { Granularity, Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartStackedHorizontalPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'BarChartStackedHorizontalPro',
  label: 'Bar Chart - Stacked Horizontal',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'yAxis', label: 'Y-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, defaultValue: false },
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseYAxis,
    inputs.xAxisRangeMin,
    inputs.xAxisRangeMax,
    inputs.showTotalLabels,
  ],
  events: [
    {
      name: 'onBarClicked',
      label: 'A bar is clicked',
      properties: [
        {
          name: 'axisDimensionValue',
          label: 'Clicked axis dimension value',
          type: 'string',
        },
        {
          name: 'groupingDimensionValue',
          label: 'Clicked grouping dimension value',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(BarChartStackedHorizontalPro, {
  yAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
  setGranularity: () => {},
});

type BarChartStackedHorizontalProState = {
  granularity?: Granularity;
};

export default defineComponent(BarChartStackedHorizontalPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [
      BarChartStackedHorizontalProState,
      (state: BarChartStackedHorizontalProState) => void,
    ],
  ) => {
    const yAxisWithGranularity = getDimensionWithGranularity(inputs.yAxis, state?.granularity);

    return {
      ...inputs,
      yAxis: yAxisWithGranularity,
      setGranularity: (granularity) => setState({ granularity }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [yAxisWithGranularity, inputs.groupBy, inputs.measure],
      }),
    };
  },
  events: {
    onBarClicked: (value) => {
      return {
        axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
        groupingDimensionValue: value.groupingDimensionValue ?? Value.noFilter(),
      };
    },
  },
});
