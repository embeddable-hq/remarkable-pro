import { CUBE_DIMENSION_TYPE_TIME, Dimension } from '@embeddable.com/core';

const ISO_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;

export const isValidISODate = (value: string): boolean => {
  return Boolean(value && ISO_DATE_TIME_REGEX.test(value));
};

export const getDimensionFieldName = (d: Dimension): string =>
  `${d.name}${d.nativeType === CUBE_DIMENSION_TYPE_TIME && d.inputs?.granularity ? `.${d.inputs.granularity}` : ''}`;
