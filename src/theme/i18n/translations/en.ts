import { ResourceLanguage } from 'i18next';

export const en: ResourceLanguage = {
  translation: {
    common: {
      other: 'Other',
      noOptionsFound: 'No options found',
      noOptionsAvailable: 'No options available',
      compared: 'Compared',
      loading: 'Loading...',
    },
    charts: {
      label: 'Label',
      primaryPeriod: 'Primary period',
      comparisonPeriod: 'Comparison period',
      'menuOptions.downloadCSV': 'Download CSV',
      'menuOptions.downloadPNG': 'Download PNG',
      'menuOptions.downloadXLSX': 'Download XLSX',
      errorTitle: 'Something went wrong.',
      errorMessage: 'An error occurred while loading the chart.',
      emptyTitle: 'No results.',
      emptyMessage: "It's a bit empty here.",
      tablePaginated: {
        pagination: 'Page {{page}} of {{totalPages}}',
      },
      pivotTable: {
        total: 'Total',
        sum: 'Sum',
        min: 'Min',
        max: 'Max',
        average: 'Average',
      },
      kpiChart: {
        noPreviousData: 'No previous data',
        equalComparison: 'No change',
      },
      scatterChart: {
        noValue: 'No value',
      },
    },
    editors: {
      errorTitle: 'Something went wrong.',
      dateRangePicker: {
        custom: 'Custom',
        backToPresets: 'Back to presets',
        apply: 'Apply',
        placeholder: 'Select date range',
      },
      filterBuilder: {
        clearAll: 'clear all',
        addFilter: 'add filter',
        deleteFilter: 'Delete filter',
        createFilterGroup: 'Create filter group',
        addToFilterGroup: 'Add to filter group',
        betweenAnd: 'and',
        and: 'and',
        or: 'or',
        disableOrOperatorToolTip:
          'Calculations and category filters can only be combined with "and", not "or".',
        is: 'is',
        isNot: 'is not',
        isOneOf: 'is one of',
        isNotOneOf: 'is not one of',
        contains: 'contains',
        equals: 'Equals',
        doesNotEqual: 'Does not equal',
        greaterThanOrEqualTo: 'Greater than or equal to',
        lessThanOrEqualTo: 'Less than or equal to',
        between: 'Between',
      },
    },
    defaults: {
      granularityOptions: {
        second: 'Second',
        minute: 'Minute',
        hour: 'Hour',
        day: 'Day',
        week: 'Week',
        month: 'Month',
        quarter: 'Quarter',
        year: 'Year',
      },
      comparisonPeriodOptions: {
        previousPeriod: 'Previous period',
        previousWeek: 'Previous week',
        previousMonth: 'Previous month',
        previousQuarter: 'Previous quarter',
        previousYear: 'Previous year',
        samePeriodLastWeek: 'Same period last week',
        samePeriodLastMonth: 'Same period last month',
        samePeriodLastQuarter: 'Same period last quarter',
        samePeriodLastYear: 'Same period last year',
      },
    },
    granularity: {
      quarter: 'Q{{quarter}} {{year}}',
    },
  },
};
