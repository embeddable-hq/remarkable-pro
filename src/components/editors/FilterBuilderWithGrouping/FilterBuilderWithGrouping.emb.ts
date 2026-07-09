import { defineComponent } from '@embeddable.com/react';
import { filterBuilderWithGrouping } from './definition';

export const preview = filterBuilderWithGrouping.preview;

export const meta = filterBuilderWithGrouping.meta;

export default defineComponent(
  filterBuilderWithGrouping.Component,
  meta,
  filterBuilderWithGrouping.config,
);
