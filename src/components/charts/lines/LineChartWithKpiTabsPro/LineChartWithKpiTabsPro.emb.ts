import { defineComponent } from '@embeddable.com/react';
import { lineChartWithKpiTabsPro } from './definition';

export const preview = lineChartWithKpiTabsPro.preview;

export const meta = lineChartWithKpiTabsPro.meta;

export default defineComponent(
  lineChartWithKpiTabsPro.Component,
  meta,
  lineChartWithKpiTabsPro.config,
);
