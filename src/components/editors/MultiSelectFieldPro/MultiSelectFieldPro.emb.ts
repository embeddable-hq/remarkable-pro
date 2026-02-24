import { defineComponent } from '@embeddable.com/react';
import { multiSelectFieldPro } from './definition';

export const preview = multiSelectFieldPro.preview;

export const meta = multiSelectFieldPro.meta;

export default defineComponent(multiSelectFieldPro.Component, meta, multiSelectFieldPro.config);
