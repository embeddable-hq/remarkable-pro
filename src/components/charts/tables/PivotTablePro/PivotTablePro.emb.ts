import { defineComponent } from '@embeddable.com/react';
import { pivotTablePro } from './definition';

export const preview = pivotTablePro.preview;

export const meta = pivotTablePro.meta;

export default defineComponent(pivotTablePro.Component, meta, pivotTablePro.config);
