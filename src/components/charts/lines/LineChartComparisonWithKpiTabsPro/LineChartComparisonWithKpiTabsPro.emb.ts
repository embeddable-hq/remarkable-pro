import { defineComponent } from '@embeddable.com/react';
import { lineChartComparisonWithKpiTabsPro } from './definition';

export const preview = lineChartComparisonWithKpiTabsPro.preview;

export const meta = lineChartComparisonWithKpiTabsPro.meta;

export default defineComponent(
  lineChartComparisonWithKpiTabsPro.Component,
  meta,
  lineChartComparisonWithKpiTabsPro.config,
);
