import { defineComponent } from '@embeddable.com/react';
import { dimensionSingleSelectFieldPro } from './definition';

export const preview = dimensionSingleSelectFieldPro.preview;

export const meta = dimensionSingleSelectFieldPro.meta;

export default defineComponent(
  dimensionSingleSelectFieldPro.Component,
  meta,
  dimensionSingleSelectFieldPro.config,
);
