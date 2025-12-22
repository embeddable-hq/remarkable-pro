import ColorType from '../editors/ColorEditor/Color.type.emb';
import { dimensionMeasureSubInputs, timeDimensionSubInputs } from './component.subinputs.constants';
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
  label: 'Time Range',
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
  label: 'Max Legend Items',
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
  label: 'Group By',
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
  label: 'Dimension Time',
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

const dimensions = {
  name: 'dimensions',
  type: 'dimension',
  label: 'Dimensions',
  config: {
    dataset: 'dataset',
  },
  required: true,
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const dimensionOrMeasure = {
  name: 'dimensionOrMeasure',
  type: 'dimensionOrMeasure',
  label: 'Dimension or Measure',
  config: {
    dataset: 'dataset',
  },
  category: 'Component Data',
  inputs: dimensionMeasureSubInputs,
} as const;

const dimensionsAndMeasures = {
  name: 'dimensionsAndMeasures',
  type: 'dimensionOrMeasure',
  label: 'Dimensions and Measures',
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

const comparisonPeriod = {
  name: 'comparisonPeriod',
  type: ComparisonPeriodType,
  label: 'Comparison Period',
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
  label: 'Show Legend',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showTooltips = {
  name: 'showTooltips',
  type: 'boolean',
  label: 'Show Tooltips',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showValueLabels = {
  name: 'showValueLabels',
  type: 'boolean',
  label: 'Show Value Labels',
  defaultValue: true,
  category: 'Component Settings',
} as const;

const showTotalLabels = {
  name: 'showTotalLabels',
  type: 'boolean',
  label: 'Show Total Labels',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const showLogarithmicScale = {
  name: 'showLogarithmicScale',
  type: 'boolean',
  label: 'Show Logarithmic Scale',
  defaultValue: false,
  category: 'Component Settings',
} as const;

const displayPercentages = {
  name: 'displayPercentages',
  type: 'boolean',
  label: 'Display Percentages',
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
  label: 'Font Size',
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
  label: 'Y-axis Label',
  category: 'Axes Settings',
} as const;

const reverseXAxis = {
  name: 'reverseXAxis',
  type: 'boolean',
  label: 'Reverse X-axis',
  defaultValue: false,
  category: 'Axes Settings',
} as const;

const reverseYAxis = {
  name: 'reverseYAxis',
  type: 'boolean',
  label: 'Reverse Y-axis',
  defaultValue: false,
  category: 'Axes Settings',
} as const;

const yAxisRangeMin = {
  name: 'yAxisRangeMin',
  type: 'number',
  label: 'Y-axis Range Min',
  category: 'Axes Settings',
} as const;

const yAxisRangeMax = {
  name: 'yAxisRangeMax',
  type: 'number',
  label: 'Y-axis Range Max',
  category: 'Axes Settings',
} as const;

const xAxisRangeMin = {
  name: 'xAxisRangeMin',
  type: 'number',
  label: 'X-axis Range Min',
  category: 'Axes Settings',
} as const;

const xAxisRangeMax = {
  name: 'xAxisRangeMax',
  type: 'number',
  label: 'X-axis Range Max',
  category: 'Axes Settings',
} as const;

const xAxisMaxItems = {
  name: 'xAxisMaxItems',
  type: 'number',
  label: 'Max X-axis Items',
  category: 'Axes Settings',
} as const;

const yAxisMaxItems = {
  name: 'yAxisMaxItems',
  type: 'number',
  label: 'Max Y-axis Items',
  category: 'Axes Settings',
} as const;

const clearable = {
  type: 'boolean',
  name: 'clearable',
  label: 'Can be cleared',
  defaultValue: true,
} as const;

const displayNullAs = { ...string, name: 'displayNullAs', label: 'Display Null As' } as const;

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
  dimensionSimple,
  dimensionTime,
  dimensionWithDateBounds,
  dimensions,
  dimensionOrMeasure,
  dimensionsAndMeasures,
  measure,
  measures,
  maxResults,
  placeholder,
  showLegend,
  showTooltips,
  showValueLabels,
  showTotalLabels,
  showLogarithmicScale,
  displayPercentages,
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
  color,
  comparisonPeriod,
  fontSize,
  clearable,
  groupBy,
  displayNullAs,
} as const;
