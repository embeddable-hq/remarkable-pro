import { defineComponent } from '@embeddable.com/react';
import { scatterChartDefaultPro } from './definition';

export const preview = scatterChartDefaultPro.preview;

export const meta = scatterChartDefaultPro.meta;

export default defineComponent(
  scatterChartDefaultPro.Component,
  meta,
  scatterChartDefaultPro.config,
);
