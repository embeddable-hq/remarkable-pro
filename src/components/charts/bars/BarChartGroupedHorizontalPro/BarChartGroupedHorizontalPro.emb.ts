import { defineComponent } from '@embeddable.com/react';
import { barChartGroupedHorizontalPro } from './definition';

export const preview = barChartGroupedHorizontalPro.preview;

export const meta = barChartGroupedHorizontalPro.meta;

export default defineComponent(
  barChartGroupedHorizontalPro.Component,
  meta,
  barChartGroupedHorizontalPro.config,
);
