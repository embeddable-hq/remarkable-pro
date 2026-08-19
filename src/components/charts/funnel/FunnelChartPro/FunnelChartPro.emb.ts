import { defineComponent } from '@embeddable.com/react';
import { funnelChartPro } from './definition';

export const preview = funnelChartPro.preview;

export const meta = funnelChartPro.meta;

export default defineComponent(funnelChartPro.Component, meta, funnelChartPro.config);
