import { defineComponent } from '@embeddable.com/react';
import { donutLabelChartPro } from './definition';

export const preview = donutLabelChartPro.preview;

export const meta = donutLabelChartPro.meta;

export default defineComponent(donutLabelChartPro.Component, meta, donutLabelChartPro.config);
