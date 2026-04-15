import { Theme } from '../../../../theme/theme.types';
import { HeatMapPropsDimension, HeatMapPropsMeasure } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { Dimension, Measure } from '@embeddable.com/core';

export const getHeatMeasure = (
  props: { measure: Measure },
  theme: Theme,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): HeatMapPropsMeasure<any> => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.measure.name,
    label: themeFormatter.dimensionOrMeasureTitle(props.measure),
    format: (value) => {
      if (theme.disableFormatting?.table?.values) {
        return value.toString();
      }
      return themeFormatter.data(props.measure, value);
    },
  };
};

export const getHeatDimension = (
  props: { dimension: Dimension; disableFormatting?: boolean },
  theme: Theme,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): HeatMapPropsDimension<any> => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.dimension.name,
    label: themeFormatter.dimensionOrMeasureTitle(props.dimension),

    format: (value: string) => {
      if (props.disableFormatting) {
        return value;
      }
      return themeFormatter.data(props.dimension, value);
    },
  };
};
