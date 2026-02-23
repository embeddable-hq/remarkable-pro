import { defineComponent } from '@embeddable.com/react';
import { barChartDefaultPro } from './definition';

export const preview = barChartDefaultPro.preview;

export const meta = barChartDefaultPro.meta;

export default defineComponent(barChartDefaultPro.Component, meta, barChartDefaultPro.config);
