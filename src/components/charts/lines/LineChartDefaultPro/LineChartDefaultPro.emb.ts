import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import LineChartDefaultPro from './index';
import { Granularity, loadData, Value } from '@embeddable.com/core';
import { LineChartProOptionsClickArg } from '../lines.utils';
import { inputs } from '../../../component.inputs.constants';
import { subInputs } from '../../../component.subinputs.constants';
import { previewData } from '../../../preview.data.constants';
import { getDimensionWithGranularity } from '../../utils/granularity.utils';

export const meta = {
  name: 'LineChartDefaultPro',
  label: 'Line Chart - Default',
  category: 'Line Charts',
  inputs: [
    inputs.dataset,
    {
      ...inputs.measures,
      inputs: [
        ...inputs.measures.inputs,
        { ...subInputs.boolean, name: 'fillUnderLine', label: 'Fill under line' },
        {
          ...subInputs.color,
          name: 'lineColor',
          label: 'Line color',
        },
        {
          ...subInputs.boolean,
          name: 'connectGaps',
          label: 'Connect gaps',
          defaultValue: true,
        },
        {
          ...subInputs.boolean,
          name: 'dashedLine',
          label: 'Dashed line',
          defaultValue: false,
        },
      ],
    },
    { ...inputs.dimensionWithGranularitySelectField, label: 'X-axis', name: 'xAxis' },
    inputs.title,
    inputs.description,
    inputs.showLegend,
    inputs.showTooltips,
    inputs.showValueLabels,
    inputs.showLogarithmicScale,
    inputs.xAxisLabel,
    inputs.yAxisLabel,
    inputs.reverseXAxis,
    inputs.yAxisRangeMin,
    inputs.yAxisRangeMax,
    inputs.maxResults,
  ],
  events: [
    {
      name: 'onLineClicked',
      label: 'A line is clicked',
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

export const preview = definePreview(LineChartDefaultPro, {
  xAxis: previewData.dimension,
  measures: [previewData.measure],
  results: previewData.results1Measure1Dimension,
  hideMenu: true,
  setGranularity: () => {},
});

type LineChartDefaultProState = {
  granularity?: Granularity;
};

export default defineComponent(LineChartDefaultPro, meta, {
  props: (
    inputs: Inputs<typeof meta>,
    [state, setState]: [LineChartDefaultProState, (state: LineChartDefaultProState) => void],
  ) => {
    const xAxisWithGranularity = getDimensionWithGranularity(inputs.xAxis, state?.granularity);

    return {
      ...inputs,
      xAxis: xAxisWithGranularity,
      setGranularity: (granularity) => setState({ granularity }),
      results: loadData({
        limit: inputs.maxResults,
        from: inputs.dataset,
        select: [...inputs.measures, xAxisWithGranularity],
      }),
    };
  },
  events: {
    onLineClicked: (value: LineChartProOptionsClickArg) => {
      return {
        axisDimensionValue: value.dimensionValue ?? Value.noFilter(),
      };
    },
  },
});
