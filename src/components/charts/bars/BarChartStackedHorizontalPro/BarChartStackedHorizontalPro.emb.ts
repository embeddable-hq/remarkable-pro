import { defineComponent } from '@embeddable.com/react';
import { barChartStackedHorizontalPro } from './definition';

export const preview = barChartStackedHorizontalPro.preview;

export const meta = barChartStackedHorizontalPro.meta;

export default defineComponent(
  barChartStackedHorizontalPro.Component,
  meta,
  barChartStackedHorizontalPro.config,
);
