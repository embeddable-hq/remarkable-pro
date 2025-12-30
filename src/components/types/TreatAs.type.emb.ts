import { defineOption, defineType } from '@embeddable.com/core';

export const TreatAsTypeOptions = {
  MARKDOWN: 'markdown',
  JSON: 'json',
} as const;

const TreatAsType = defineType('TreatAs', {
  label: 'Treat as',
  optionLabel: (value: string) => value,
});

defineOption(TreatAsType, TreatAsTypeOptions.MARKDOWN);
defineOption(TreatAsType, TreatAsTypeOptions.JSON);

export default TreatAsType;
