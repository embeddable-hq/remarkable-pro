import { defineOption, defineType } from '@embeddable.com/core';

export const ExportOptionTypeOptions = {
  csv: 'csv',
  xlsx: 'xlsx',
  png: 'png',
  maximize: 'maximize',
} as const;

const ExportOptionType = defineType('exportOption', {
  label: 'Menu option',
  optionLabel: (value: string) => value,
});

defineOption(ExportOptionType, ExportOptionTypeOptions.csv);
defineOption(ExportOptionType, ExportOptionTypeOptions.xlsx);
defineOption(ExportOptionType, ExportOptionTypeOptions.png);
defineOption(ExportOptionType, ExportOptionTypeOptions.maximize);

export default ExportOptionType;
