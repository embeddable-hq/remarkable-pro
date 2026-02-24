import { defineComponent } from '@embeddable.com/react';
import { donutChartPro } from './definition';

export const preview = donutChartPro.preview;

export const meta = donutChartPro.meta;

export default defineComponent(donutChartPro.Component, meta, donutChartPro.config);
