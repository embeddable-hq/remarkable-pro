import { defineComponent } from '@embeddable.com/react';
import { singleSelectFieldPro } from './definition';

export const preview = singleSelectFieldPro.preview;

export const meta = singleSelectFieldPro.meta;

export default defineComponent(singleSelectFieldPro.Component, meta, singleSelectFieldPro.config);
