import { defineComponent } from '@embeddable.com/react';
import { scatterChartPro } from './definition';

export const preview = scatterChartPro.preview;

export const meta = scatterChartPro.meta;

export default defineComponent(scatterChartPro.Component, meta, scatterChartPro.config);
