import { defineComponent } from '@embeddable.com/react';
import { tableChartPaginated } from './definition';

export const preview = tableChartPaginated.preview;

export const meta = tableChartPaginated.meta;

// @ts-expect-error - to be fixed in @embeddable.com/react
export default defineComponent(tableChartPaginated.Component, meta, tableChartPaginated.config);
