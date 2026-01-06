import { defineOption, defineType } from '@embeddable.com/core';

export const DisplayFormatTypeOptions = {
  MARKDOWN: 'markdown',
  JSON: 'json',
} as const;

const DisplayFormatType = defineType('DisplayFormat', {
  label: 'Display format',
  optionLabel: (value: string) => value,
});

defineOption(DisplayFormatType, DisplayFormatTypeOptions.MARKDOWN);
defineOption(DisplayFormatType, DisplayFormatTypeOptions.JSON);

export default DisplayFormatType;
