import { defineComponent } from '@embeddable.com/react';
import { barLineChartPro } from './definition';

export const preview = barLineChartPro.preview;
export const meta = barLineChartPro.meta;

export default defineComponent(barLineChartPro.Component, meta, barLineChartPro.config);
