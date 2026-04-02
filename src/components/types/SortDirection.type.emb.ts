import { defineOption, defineType, OrderDirection } from '@embeddable.com/core';

export const SortDirectionTypeOptions = {
  asc: 'asc',
  desc: 'desc',
} as const;

export const getSortDirectionValue = (
  sortDirection?: OrderDirection,
): OrderDirection | undefined => {
  if (!sortDirection) return undefined;
  return SortDirectionTypeOptions[sortDirection];
};

const sortDirectionLabelMap: Record<OrderDirection, string> = {
  [SortDirectionTypeOptions.asc]: 'Ascending',
  [SortDirectionTypeOptions.desc]: 'Descending',
};

const SortDirectionType = defineType('sortDirection', {
  label: 'Sort direction',
  optionLabel: (value: OrderDirection) => sortDirectionLabelMap[value],
});

defineOption(SortDirectionType, SortDirectionTypeOptions.asc);
defineOption(SortDirectionType, SortDirectionTypeOptions.desc);

export default SortDirectionType;
