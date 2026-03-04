import { defineComponent } from '@embeddable.com/react';
import { horizontalDividerPro } from './definition';

export const preview = horizontalDividerPro.preview;

export const meta = horizontalDividerPro.meta;

export default defineComponent(horizontalDividerPro.Component, meta, horizontalDividerPro.config);
