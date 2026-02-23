import { defineComponent } from '@embeddable.com/react';
import { lineChartDefaultPro } from './definition';

export const preview = lineChartDefaultPro.preview;

export const meta = lineChartDefaultPro.meta;

export default defineComponent(lineChartDefaultPro.Component, meta, lineChartDefaultPro.config);
