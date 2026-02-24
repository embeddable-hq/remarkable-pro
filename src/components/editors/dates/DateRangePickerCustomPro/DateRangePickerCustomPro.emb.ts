import { defineComponent } from '@embeddable.com/react';
import { dateRangePickerCustomPro } from './definition';

export const preview = dateRangePickerCustomPro.preview;

export const meta = dateRangePickerCustomPro.meta;

export default defineComponent(
  dateRangePickerCustomPro.Component,
  meta,
  dateRangePickerCustomPro.config,
);
