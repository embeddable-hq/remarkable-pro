import { defineComponent } from '@embeddable.com/react';
import { tableScrollable } from './definition';

export const preview = tableScrollable.preview;

export const meta = tableScrollable.meta;

// @ts-expect-error - to be fixed in @embeddable.com/react
export default defineComponent(tableScrollable.Component, meta, tableScrollable.config);
