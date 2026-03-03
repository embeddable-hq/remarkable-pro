import { defineComponent } from '@embeddable.com/react';
import { markdownPro } from './definition';

export const preview = markdownPro.preview;

export const meta = markdownPro.meta;

// @ts-expect-error - to be fixed in @embeddable.com/react
export default defineComponent(markdownPro.Component, meta, markdownPro.config);
