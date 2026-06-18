import { defineOption, defineType } from '@embeddable.com/core';

export const ExportOptionTypeOptions = {
  csv: 'csv',
  xlsx: 'xlsx',
  png: 'png',
} as const;

const ExportOptionType = defineType('exportOption', {
  label: 'Export option',
  optionLabel: (value: string) => value,
});

defineOption(ExportOptionType, ExportOptionTypeOptions.csv);
defineOption(ExportOptionType, ExportOptionTypeOptions.xlsx);
defineOption(ExportOptionType, ExportOptionTypeOptions.png);

export default ExportOptionType;
