import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import KpiChartNumberPro from './index';
import { loadData } from '@embeddable.com/core';
import { inputs } from '../../../component.inputs.constants';
import { previewData } from '../../../preview.data.constants';

export const meta = {
  name: 'KpiChartNumberPro',
  label: 'Kpi Chart - Number',
  category: 'Kpi Charts',
  inputs: [
    inputs.dataset,
    inputs.measure,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.fontSize,
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(KpiChartNumberPro, {
  measure: {
    ...previewData.measure,
  },
  results: previewData.results1Measure,
  fontSize: 100,
  hideMenu: true,
});

export default defineComponent(KpiChartNumberPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      results: loadData({
        from: inputs.dataset,
        select: [inputs.measure],
      }),
    };
  },
});
