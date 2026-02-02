import ColorType from '../editors/ColorEditor/Color.type.emb';
import { Granularity } from '../theme/defaults/defaults.GranularityOptions.constants';
import {
  dimensionMeasureSubInputs,
  subInputs,
  timeDimensionSubInputs,
  timeDimensionWithGranularitySelectFieldSubInputs,
} from './component.subinputs.constants';
import ComparisonPeriodType from './types/ComparisonPeriod.type.emb';

/* -------------------- */
/* ----- Generics ----- */
/* -------------------- */

const boolean = {
  name: 'boolean',
  type: 'boolean',
  label: 'Boolean',
} as const;

const timeRange = {
  name: 'timeRange',
  type: 'timeRange',
  label: 'Time range',
} as const;

const number = {
  name: 'number',
  type: 'number',
  label: 'Number',
} as const;

const string = {
  name: 'string',
  type: 'string',
  label: 'String',
} as const;

/* ------------------ */
/* ----- Common ----- */
/* ------------------ */

const title = {
  name: 'title',
  type: 'string',
  label: 'Title',
  category: 'Component Header',
} as const;

const description = {
  name: 'description',
  type: 'string',
  label: 'Description',
  category: 'Component Header',
} as const;

const dataset = {
  name: 'dataset',
  type: 'dataset',
  label: 'Dataset',
  required: true,
  category: 'Component Data',
} as const;

const maxLegendItems = {
  name: 'maxLegendItems',
  type: 'number',
  label: 'Max legend items',
  defaultValue: 10,
  category: 'Component Data',
} as const;

const dimension = {
  name: 'dimension',
  type: 'dimension',
  label: 'Dimension',
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const groupBy = {
  ...dimension,
  name: 'groupBy',
  label: 'Group by',
} as const;

const granularity = {
  name: 'granularity',
  type: 'granularity',
  label: 'Granularity',
} as const;

const granularities = {
  name: 'granularities',
  type: 'granularity',
  label: 'Granularities',
  array: true,
  // Ignore seconds and minutes
  defaultValue: [
    Granularity.hour,
    Granularity.day,
    Granularity.week,
    Granularity.month,
    Granularity.quarter,
    Granularity.year,
  ],
} as const;

const dimensionSimple = {
  name: 'dimensionSimple',
  type: 'dimension',
  label: 'Dimension',
  config: {
    dataset: 'dataset',
    hideGranularity: true,
  },
  required: true,
  category: 'Component Data',
} as const;

const dimensionTime = {
  name: 'dimensionTime',
  type: 'dimension',
  label: 'Dimension time',
  config: {
    dataset: 'dataset',
    supportedTypes: ['time'],
    hideGranularity: true,
  },
  required: true,
  category: 'Component Data',
} as const;

const dimensionWithDateBounds = {
  name: 'dimension',
  type: 'dimension',
  label: 'Dimension',
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: timeDimensionSubInputs,
} as const;

const dimensionWithGranularitySelectField = {
  name: 'dimension',
  type: 'dimension',
  label: 'Dimension',
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: timeDimensionWithGranularitySelectFieldSubInputs,
} as const;

const dimensions = {
  name: 'dimensions',
  type: 'dimension',
  label: 'Dimensions',
  config: {
    dataset: 'dataset',
  },
  array: true,
  required: true,
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const dimensionOrMeasure = {
  name: 'dimensionOrMeasure',
  type: 'dimensionOrMeasure',
  label: 'Dimension or measure',
  config: {
    dataset: 'dataset',
  },
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const dimensionsAndMeasures = {
  name: 'dimensionsAndMeasures',
  type: 'dimensionOrMeasure',
  label: 'Dimensions and measures',
  array: true,
  required: true,
  config: {
    dataset: 'dataset',
  },
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const measure = {
  name: 'measure',
  type: 'measure',
  label: 'Measure',
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const measures = {
  name: 'measures',
  type: 'measure',
  label: 'Measures',
  array: true,
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const measureOptions = {
  ...measures,
  name: 'measureOptions',
  label: 'Measure options',
  inputs: [subInputs.displayName],
};

const dimensionOptions = {
  ...dimensions,
  name: 'dimensionOptions',
  label: 'Dimension options',
  inputs: [subInputs.displayName],
};

const comparisonPeriod = {
  name: 'comparisonPeriod',
  type: ComparisonPeriodType,
  label: 'Comparison period',
  category: 'Component data',
};

const maxResults = {
  name: 'maxResults',
  type: 'number',
  label: 'Max results',
  category: 'Component Settings',
  defaultValue: 1000,
} as const;

const placeholder = {
  name: 'placeholder',
  type: 'string',
  label: 'Placeholder',
  category: 'Component Settings',
} as const;

const showLegend = {
  name: 'showLegend',
  type: 'boolean',
  label: 'Show legend',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showTooltips = {
  name: 'showTooltips',
  type: 'boolean',
  label: 'Show tooltips',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showValueLabels = {
  name: 'showValueLabels',
  type: 'boolean',
  label: 'Show value labels',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showTotalLabels = {
  name: 'showTotalLabels',
  type: 'boolean',
  label: 'Show total labels',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const showLogarithmicScale = {
  name: 'showLogarithmicScale',
  type: 'boolean',
  label: 'Show logarithmic scale',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const displayPercentages = {
  name: 'displayPercentages',
  type: 'boolean',
  label: 'Display percentages',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const color = {
  type: ColorType,
  name: 'color',
  label: 'Color',
  category: 'Component Settings',
} as const;

const fontSize = {
  type: 'number',
  name: 'fontSize',
  label: 'Font size',
  category: 'Component Settings',
} as const;

const clearable = {
  type: 'boolean',
  name: 'clearable',
  label: 'Can be cleared',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const displayNullAs = {
  ...string,
  name: 'displayNullAs',
  label: 'Display null as',
  category: 'Component Settings',
} as const;

const xAxisLabel = {
  name: 'xAxisLabel',
  type: 'string',
  label: 'X-axis Label',
  category: 'Axes Settings',
} as const;

const yAxisLabel = {
  name: 'yAxisLabel',
  type: 'string',
  label: 'Y-axis label',
  category: 'Axes Settings',
} as const;

const reverseXAxis = {
  name: 'reverseXAxis',
  type: 'boolean',
  label: 'Reverse x-axis',
  defaultValue: false,
  category: 'Axes Settings',
} as const;

const reverseYAxis = {
  name: 'reverseYAxis',
  type: 'boolean',
  label: 'Reverse y-axis',
  defaultValue: false,
  category: 'Axes Settings',
} as const;

const yAxisRangeMin = {
  name: 'yAxisRangeMin',
  type: 'number',
  label: 'Y-axis range min',
  category: 'Axes Settings',
} as const;

const yAxisRangeMax = {
  name: 'yAxisRangeMax',
  type: 'number',
  label: 'Y-axis range max',
  category: 'Axes Settings',
} as const;

const xAxisRangeMin = {
  name: 'xAxisRangeMin',
  type: 'number',
  label: 'X-axis range min',
  category: 'Axes Settings',
} as const;

const xAxisRangeMax = {
  name: 'xAxisRangeMax',
  type: 'number',
  label: 'X-axis range max',
  category: 'Axes Settings',
} as const;

const xAxisMaxItems = {
  name: 'xAxisMaxItems',
  type: 'number',
  label: 'Max x-axis items',
  category: 'Axes Settings',
} as const;

const yAxisMaxItems = {
  name: 'yAxisMaxItems',
  type: 'number',
  label: 'Max y-axis items',
  category: 'Axes Settings',
} as const;

export const inputs = {
  boolean,
  timeRange,
  number,
  string,
  title,
  description,
  dataset,
  maxLegendItems,
  dimension,
  groupBy,
  dimensionSimple,
  dimensionTime,
  dimensionWithDateBounds,
  dimensionWithGranularitySelectField,
  dimensions,
  dimensionOrMeasure,
  dimensionsAndMeasures,
  measure,
  measures,
  measureOptions,
  dimensionOptions,
  comparisonPeriod,
  maxResults,
  placeholder,
  showLegend,
  showTooltips,
  showValueLabels,
  showTotalLabels,
  showLogarithmicScale,
  displayPercentages,
  color,
  fontSize,
  clearable,
  displayNullAs,
  xAxisLabel,
  yAxisLabel,
  reverseXAxis,
  reverseYAxis,
  yAxisRangeMin,
  yAxisRangeMax,
  xAxisRangeMin,
  xAxisRangeMax,
  xAxisMaxItems,
  yAxisMaxItems,
  granularity,
  granularities,
} as const;
