import { Dimension, Granularity } from '@embeddable.com/core';

export const getDimensionWithGranularity = (
  dimension: Dimension,
  granularity?: Granularity,
): Dimension => {
  const currentGranularity = granularity ?? dimension.inputs?.granularity;

  return {
    ...dimension,
    inputs: {
      ...dimension.inputs,
      granularity: currentGranularity,
    },
  };
};
