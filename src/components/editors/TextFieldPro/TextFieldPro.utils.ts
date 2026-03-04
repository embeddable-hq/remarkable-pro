import { Value } from '@embeddable.com/core';

export const getTextFieldProOnChangeValue = (value: string | null | undefined) =>
  value === '' || value == null ? Value.noFilter() : value;
