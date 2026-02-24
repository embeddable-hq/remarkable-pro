import { defineComponent } from '@embeddable.com/react';
import { barChartGroupedPro } from './definition';

export const preview = barChartGroupedPro.preview;

export const meta = barChartGroupedPro.meta;

export default defineComponent(barChartGroupedPro.Component, meta, barChartGroupedPro.config);
