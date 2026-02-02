import { DimensionOrMeasure } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';

export const getDimensionAndMeasureOptions = ({
  dimensionsAndMeasures,
  searchValue,
  theme,
}: {
  dimensionsAndMeasures: DimensionOrMeasure[];
  searchValue: string;
  theme: Theme;
}): SelectListOptionProps[] => {
  const themeFormatter = getThemeFormatter(theme);

  return dimensionsAndMeasures
    .filter((dimensionOrMeasure) => {
      return themeFormatter
        .dimensionOrMeasureTitle(dimensionOrMeasure)
        .toLowerCase()
        .includes(searchValue.toLowerCase());
    })
    .map((dimensionOrMeasure) => {
      return {
        value: dimensionOrMeasure.name,
        label: themeFormatter.dimensionOrMeasureTitle(dimensionOrMeasure),
      };
    });
};
