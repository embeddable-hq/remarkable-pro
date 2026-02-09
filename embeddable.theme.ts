import { BaseChartTypes, Theme } from './src/theme/theme.types';
import { remarkableTheme } from './src/theme/theme.constants';
import { defineTheme } from '@embeddable.com/core';

const themeProvider = (): Theme => {
  const theme = defineTheme<Theme>(remarkableTheme, {
    useCustomProps: async <T extends BaseChartTypes>(props: T, chartName: string): Promise<T> => {
      // Example of a custom props hook that manipulates data from the results prop before it is used in the chart.
      if (chartName === 'BarChartDefaultPro' && typeof props === 'object' && props !== null) {
        const data = props.results?.data || [];
        // Simulate an API request or some data manipulation here. For example, we could filter out certain data points, or add additional data points based on the existing data.
        const manipulatedData = data.map((row) => {
          // Example manipulation: add a new field to each row based on existing fields
          return {
            ...row,
            manipulatedValue: row[props.dimension.name] * 2, // Just an example manipulation
          };
        });
        // Return the new props with the manipulated data. The chart will then use this manipulated data instead of the original data.
        const newProps = {
          ...props,
          results: {
            ...props.results,
            data: manipulatedData,
          },
        };
        return newProps as T;
      }
      return props as T;
    },
  });
  return theme;
};

export default themeProvider;
