import { defineComponent } from '@embeddable.com/react';
import { dimensionOrMeasureMultiSelectFieldPro } from './definition';

export const preview = dimensionOrMeasureMultiSelectFieldPro.preview;

export const meta = dimensionOrMeasureMultiSelectFieldPro.meta;

export default defineComponent(
  dimensionOrMeasureMultiSelectFieldPro.Component,
  meta,
  dimensionOrMeasureMultiSelectFieldPro.config,
);
