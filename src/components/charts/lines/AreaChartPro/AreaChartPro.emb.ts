import { defineComponent } from '@embeddable.com/react';
import { areaChartPro } from './definition';

export const preview = areaChartPro.preview;

export const meta = areaChartPro.meta;

export default defineComponent(areaChartPro.Component, meta, areaChartPro.config);
