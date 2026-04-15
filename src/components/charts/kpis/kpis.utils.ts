import { DataResponse, Measure } from '@embeddable.com/core';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { Theme } from '../../../theme/theme.types';

export const getKpiValueFormatter =
  (props: { measure: Measure }, theme: Theme) =>
  (valueToFormat: number): string => {
    if (theme.disableFormatting?.kpi?.value) {
      return valueToFormat.toString();
    }

    const themeFormatter = getThemeFormatter(theme);
    return themeFormatter.data(props.measure, valueToFormat);
  };

export const getKpiResults = (
  results: DataResponse,
  measure: Measure,
  hasDisplayNullAs: boolean,
): DataResponse => {
  if (!hasDisplayNullAs) return results;
  const hasNoData = !results.data || results.data.length === 0;
  return hasNoData ? { ...results, data: [{ [measure.name]: null }] } : results;
};
