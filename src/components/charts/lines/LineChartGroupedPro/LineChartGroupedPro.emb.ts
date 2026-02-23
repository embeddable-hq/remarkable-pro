import { defineComponent } from '@embeddable.com/react';
import { lineChartGroupedPro } from './definition';

export const preview = lineChartGroupedPro.preview;

export const meta = lineChartGroupedPro.meta;

export default defineComponent(lineChartGroupedPro.Component, meta, lineChartGroupedPro.config);
