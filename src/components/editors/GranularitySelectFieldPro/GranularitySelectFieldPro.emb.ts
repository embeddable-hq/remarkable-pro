import { defineComponent } from '@embeddable.com/react';
import { granularitySelectFieldPro } from './definition';

export const preview = granularitySelectFieldPro.preview;

export const meta = granularitySelectFieldPro.meta;

export default defineComponent(
  granularitySelectFieldPro.Component,
  meta,
  granularitySelectFieldPro.config,
);
