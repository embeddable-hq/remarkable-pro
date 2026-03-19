import { defineComponent } from '@embeddable.com/react';
import { barChartDefaultWithLinePro } from './definition';

export const preview = barChartDefaultWithLinePro.preview;

export const meta = barChartDefaultWithLinePro.meta;

export default defineComponent(
  barChartDefaultWithLinePro.Component,
  meta,
  barChartDefaultWithLinePro.config,
);
