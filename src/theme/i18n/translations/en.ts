import { ResourceLanguage } from 'i18next';

export const en: ResourceLanguage = {
  translation: {
    common: {
      other: 'Other',
      noOptionsFound: 'No options found',
      noOptionsAvailable: 'No options available',
      compared: 'Compared',
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
      emptyTitle: "It's a bit empty here.",
      emptyMessage: 'Try adding something.',
      tablePaginated: {
        pagination: 'Page {{page}} of {{totalPages}}',
      },
      pivotTable: {
        total: 'Total',
      },
      kpiChart: {
        noPreviousData: 'No previous data',
        equalComparison: 'No change',
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
    },
    defaults: {
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
