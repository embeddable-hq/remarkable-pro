import { defineComponent } from '@embeddable.com/react';
import { bubbleChartPro } from './definition';

export const preview = bubbleChartPro.preview;

export const meta = bubbleChartPro.meta;

export default defineComponent(bubbleChartPro.Component, meta, bubbleChartPro.config);
