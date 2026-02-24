import { defineComponent } from '@embeddable.com/react';
import { comparisonPeriodSelectFieldPro } from './definition';

export const preview = comparisonPeriodSelectFieldPro.preview;

export const meta = comparisonPeriodSelectFieldPro.meta;

export default defineComponent(
  comparisonPeriodSelectFieldPro.Component,
  meta,
  comparisonPeriodSelectFieldPro.config,
);
