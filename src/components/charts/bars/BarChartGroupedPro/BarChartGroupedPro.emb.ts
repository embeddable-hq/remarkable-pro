import { Granularity, Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartGroupedPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'BarChartGroupedPro',
  label: 'Bar Chart - Grouped',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    { ...inputs.dimensionWithGranularitySelectField, name: 'xAxis', label: 'X-axis' },
    inputs.groupBy,
    inputs.title,
    inputs.description,
    inputs.maxResults,
    inputs.showLegend,
    inputs.showTooltips,
    { ...inputs.showValueLabels, defaultValue: false },
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
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

export const preview = definePreview(BarChartGroupedPro, {
  xAxis: previewData.dimension,
  groupBy: previewData.dimensionGroup,
  measure: previewData.measure,
  results: previewData.results1Measure2Dimensions,
  hideMenu: true,
  setGranularity: () => {},
});

type BarChartGroupedProState = {
  granularity?: Granularity;
};

export default defineComponent(BarChartGroupedPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [BarChartGroupedProState, (state: BarChartGroupedProState) => void],
  ) => {
    const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

    return {
      ...inputs,
      xAxis: xAxisWithGranularity,
      setGranularity: (granularity) => setState({ granularity }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [xAxisWithGranularity, inputs.groupBy, inputs.measure],
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
