import { Granularity, Value, loadData } from '@embeddable.com/core';
import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import BarChartDefaultPro from './index';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'BarChartDefaultPro',
  label: 'Bar Chart - Default',
  category: 'Bar Charts',
  inputs: [
    inputs.dataset,
    { ...inputs.measures, inputs: [...inputs.measures.inputs, inputs.color] },
    {
      ...inputs.dimensionWithGranularitySelectField,
      label: 'X-axis',
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.xAxisMaxItems,
    inputs.maxResults,
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
      ],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(BarChartDefaultPro, {
  dimension: previewData.dimension,
  measures: [previewData.measure],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
  setGranularity: () => {},
});

type BarChartDefaultProState = {
  granularity?: Granularity;
};

export default defineComponent(BarChartDefaultPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [BarChartDefaultProState, (state: BarChartDefaultProState) => void],
  ) => {
    const dimensionWithGranularity = getDimensionWithGranularity(
      inputs.dimension,
      state?.granularity,
    );

    return {
      ...inputs,
      dimension: dimensionWithGranularity,
      setGranularity: (granularity) => setState({ granularity }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [...inputs.measures, dimensionWithGranularity],
      }),
    };
  },
  events: {
    onBarClicked: (value) => {
      return {
        axisDimensionValue: value.axisDimensionValue ?? Value.noFilter(),
      };
    },
  },
});
