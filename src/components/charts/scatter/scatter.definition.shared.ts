import { inputs } from '../../component.inputs.constants';
import { subInputs } from '../../component.subinputs.constants';

export const showPointLabelsInput = {
  ...inputs.boolean,
  name: 'showPointLabels',
  label: 'Show point labels',
  defaultValue: false,
  category: 'Component Settings',
} as const;

export const scatterBaseInputs = [inputs.dataset, inputs.xMeasure, inputs.yMeasure] as const;

export const scatterPointAndGroupInputs = [
  { ...inputs.dimension, name: 'pointDimension', label: 'Point dimension' },
  { ...inputs.dimension, name: 'groupByDimension', label: 'Group by (optional)', required: false },
  { ...subInputs.color, name: 'pointColor', label: 'Point color', category: 'Component Settings' },
] as const;

export const scatterDisplayInputs = [
  inputs.title,
  inputs.description,
  inputs.tooltip,
  inputs.showLegend,
  inputs.showTooltips,
  showPointLabelsInput,
  inputs.showValueLabels,
  inputs.showLogarithmicScale,
  inputs.xAxisLabel,
  inputs.yAxisLabel,
  inputs.reverseXAxis,
  inputs.xAxisRangeMin,
  inputs.xAxisRangeMax,
  inputs.yAxisRangeMin,
  inputs.yAxisRangeMax,
  inputs.maxResults,
] as const;
