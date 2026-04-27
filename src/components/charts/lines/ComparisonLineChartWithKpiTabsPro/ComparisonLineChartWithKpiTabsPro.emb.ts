import { defineComponent } from '@embeddable.com/react';
import { comparisonLineChartWithKpiTabsPro } from './definition';

export const preview = comparisonLineChartWithKpiTabsPro.preview;

export const meta = comparisonLineChartWithKpiTabsPro.meta;

export default defineComponent(
  comparisonLineChartWithKpiTabsPro.Component,
  meta,
  comparisonLineChartWithKpiTabsPro.config,
);
