import { defineComponent } from '@embeddable.com/react';
import { kpiChartNumberPro } from './definition';

export const preview = kpiChartNumberPro.preview;

export const meta = kpiChartNumberPro.meta;

export default defineComponent(kpiChartNumberPro.Component, meta, kpiChartNumberPro.config);
