import { defineComponent } from '@embeddable.com/react';
import { measureSingleSelectFieldPro } from './definition';

export const preview = measureSingleSelectFieldPro.preview;

export const meta = measureSingleSelectFieldPro.meta;

export default defineComponent(
  measureSingleSelectFieldPro.Component,
  meta,
  measureSingleSelectFieldPro.config,
);
