import { defineComponent } from '@embeddable.com/react';
import { filterBuilderWithGroupingPro } from './definition';

export const preview = filterBuilderWithGroupingPro.preview;

export const meta = filterBuilderWithGroupingPro.meta;

export default defineComponent(
  filterBuilderWithGroupingPro.Component,
  meta,
  filterBuilderWithGroupingPro.config,
);
