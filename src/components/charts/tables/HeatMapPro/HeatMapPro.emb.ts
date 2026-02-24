import { defineComponent } from '@embeddable.com/react';
import { heatMapPro } from './definition';

export const preview = heatMapPro.preview;

export const meta = heatMapPro.meta;

// @ts-expect-error - to be fixed in @embeddable.com/react
export default defineComponent(heatMapPro.Component, meta, heatMapPro.config);
