import { defineOption, defineType } from '@embeddable.com/core';

const SortDirectionType = defineType('sortDirection', {
  label: 'Sort direction',
  optionLabel: (value: string) => value,
});

defineOption(SortDirectionType, 'Ascending');
defineOption(SortDirectionType, 'Descending');

export default SortDirectionType;
