import { defineComponent } from '@embeddable.com/react';
import { pieChartPro } from './definition';

export const preview = pieChartPro.preview;

export const meta = pieChartPro.meta;

export default defineComponent(pieChartPro.Component, meta, pieChartPro.config);
