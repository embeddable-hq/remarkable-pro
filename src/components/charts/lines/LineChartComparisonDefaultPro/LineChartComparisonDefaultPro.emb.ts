import { defineComponent } from '@embeddable.com/react';
import { lineChartComparisonDefaultPro } from './definition';

export const preview = lineChartComparisonDefaultPro.preview;

export const meta = lineChartComparisonDefaultPro.meta;

export default defineComponent(
  lineChartComparisonDefaultPro.Component,
  meta,
  lineChartComparisonDefaultPro.config,
);
