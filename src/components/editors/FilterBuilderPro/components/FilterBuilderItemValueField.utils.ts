export const normalizeSelectedValues = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (value === null || value === undefined) return [];
  return [value as string];
};

export const sortOptionsWithSelectedFirst = <T extends { value: string }>(
  rawOptions: T[],
  selectedValues: string[],
): T[] => [
  ...rawOptions.filter((o) => selectedValues.includes(o.value)),
  ...rawOptions.filter((o) => !selectedValues.includes(o.value)),
];

export const getMultiSelectDisplayValue = (
  filterValue: string[],
  getLabel: (value: string) => string,
): string => {
  if (filterValue.length === 0) return '...';
  if (filterValue.length > 2) return `${filterValue.length} selected`;
  return filterValue.map(getLabel).join(', ');
};
