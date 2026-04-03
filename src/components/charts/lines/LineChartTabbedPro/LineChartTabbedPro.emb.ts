import { defineComponent } from '@embeddable.com/react';
import { lineChartTabbedPro } from './definition';

export const preview = lineChartTabbedPro.preview;

export const meta = lineChartTabbedPro.meta;

export default defineComponent(lineChartTabbedPro.Component, meta, lineChartTabbedPro.config);
