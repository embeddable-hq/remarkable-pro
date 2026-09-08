import { defineComponent } from '@embeddable.com/react';
import { funnelChartPro } from './definition';

export const preview = funnelChartPro.preview;

export const meta = funnelChartPro.meta;

// @ts-expect-error - to be fixed in @embeddable.com/react
export default defineComponent(funnelChartPro.Component, meta, funnelChartPro.config);
