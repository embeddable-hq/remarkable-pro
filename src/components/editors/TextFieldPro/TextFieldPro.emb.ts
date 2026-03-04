import { defineComponent } from '@embeddable.com/react';
import { textFieldPro } from './definition';

export const preview = textFieldPro.preview;

export const meta = textFieldPro.meta;

export default defineComponent(textFieldPro.Component, meta, textFieldPro.config);
