import { defineComponent } from '@embeddable.com/react';
import { kpiChartNumberComparisonPro } from './definition';

export const preview = kpiChartNumberComparisonPro.preview;

export const meta = kpiChartNumberComparisonPro.meta;

export default defineComponent(
  kpiChartNumberComparisonPro.Component,
  meta,
  kpiChartNumberComparisonPro.config,
);
