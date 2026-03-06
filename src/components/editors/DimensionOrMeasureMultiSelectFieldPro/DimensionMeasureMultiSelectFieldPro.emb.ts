import { defineComponent } from '@embeddable.com/react';
import { dimensionMeasureMultiSelectFieldPro } from './definition';

export const preview = dimensionMeasureMultiSelectFieldPro.preview;

export const meta = dimensionMeasureMultiSelectFieldPro.meta;

export default defineComponent(
  dimensionMeasureMultiSelectFieldPro.Component,
  meta,
  dimensionMeasureMultiSelectFieldPro.config,
);
