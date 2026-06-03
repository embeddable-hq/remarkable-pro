import { defineOption, defineType } from '@embeddable.com/core';

export const ExportOption = {
  csv: 'csv',
  xlsx: 'xlsx',
  png: 'png',
} as const;

const ExportOptionType = defineType('exportOption', {
  label: 'Export option',
  optionLabel: (value: string) => value,
});

defineOption(ExportOptionType, ExportOption.csv);
defineOption(ExportOptionType, ExportOption.xlsx);
defineOption(ExportOptionType, ExportOption.png);

export default ExportOptionType;
