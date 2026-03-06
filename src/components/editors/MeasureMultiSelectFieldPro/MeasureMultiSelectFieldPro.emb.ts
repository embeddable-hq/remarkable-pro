import { defineComponent } from '@embeddable.com/react';
import { measureMultiSelectFieldPro } from './definition';

export const preview = measureMultiSelectFieldPro.preview;

export const meta = measureMultiSelectFieldPro.meta;

export default defineComponent(
  measureMultiSelectFieldPro.Component,
  meta,
  measureMultiSelectFieldPro.config,
);
