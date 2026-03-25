import { defineComponent } from '@embeddable.com/react';
import { filterBuilderPro } from './definition';

export const preview = filterBuilderPro.preview;

export const meta = filterBuilderPro.meta;

export default defineComponent(filterBuilderPro.Component, meta, filterBuilderPro.config);
