import { defineComponent } from '@embeddable.com/react';
import { barChartDefaultHorizontalPro } from './definition';

export const preview = barChartDefaultHorizontalPro.preview;

export const meta = barChartDefaultHorizontalPro.meta;

export default defineComponent(
  barChartDefaultHorizontalPro.Component,
  meta,
  barChartDefaultHorizontalPro.config,
);
