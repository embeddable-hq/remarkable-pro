import { defineComponent } from '@embeddable.com/react';
import { barChartStackedPro } from './definition';

export const preview = barChartStackedPro.preview;

export const meta = barChartStackedPro.meta;

export default defineComponent(barChartStackedPro.Component, meta, barChartStackedPro.config);
