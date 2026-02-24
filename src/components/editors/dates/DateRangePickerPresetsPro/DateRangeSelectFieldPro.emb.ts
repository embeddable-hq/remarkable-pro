import { defineComponent } from '@embeddable.com/react';
import { dateRangeSelectFieldPro } from './definition';

export const preview = dateRangeSelectFieldPro.preview;

export const meta = dateRangeSelectFieldPro.meta;

export default defineComponent(
  dateRangeSelectFieldPro.Component,
  meta,
  dateRangeSelectFieldPro.config,
);
