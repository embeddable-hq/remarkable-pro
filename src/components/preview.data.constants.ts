import { mockDataResponse, mockDimension, mockMeasure } from '@embeddable.com/core';

const dimensionName = 'country';
const measureName = 'count';
const dimensionGroupName = 'category';

const dimension = mockDimension(dimensionName, 'string', { title: 'Country' });
const measure = mockMeasure(measureName, 'number', { title: 'Count' });
const dimensionGroup = mockDimension(dimensionGroupName, 'string', {
  title: 'Category',
});

const results1Measure1Dimension = mockDataResponse(
  [dimensionName, measureName],
  [
    ['US', 120],
    ['GER', 100],
    ['UK', 80],
    ['FRA', 70],
    ['SPA', 55],
  ],
);

const results1Measure1DimensionVariant = mockDataResponse(
  [dimensionName, dimensionGroupName, measureName],
  [
    ['US', 100],
    ['GER', 90],
    ['UK', 75],
    ['FRA', 85],
    ['SPA', 60],
  ],
);

const results1Measure2Dimensions = mockDataResponse(
  [dimensionName, dimensionGroupName, measureName],
  [
    ['US', 'Cat 1', 120],
    ['US', 'Cat 2', 130],

    ['GER', 'Cat 1', 100],
    ['GER', 'Cat 2', 110],

    ['UK', 'Cat 1', 80],
    ['UK', 'Cat 2', 95],

    ['FRA', 'Cat 1', 70],
    ['FRA', 'Cat 2', 60],

    ['SPA', 'Cat 1', 55],
    ['SPA', 'Cat 2', 35],
  ],
);

const results1Measure2DimensionsVariant = mockDataResponse(
  [dimensionName, dimensionGroupName, measureName],
  [
    ['US', 'Cat 1', 100],
    ['US', 'Cat 2', 115],

    ['GER', 'Cat 1', 90],
    ['GER', 'Cat 2', 125],

    ['UK', 'Cat 1', 75],
    ['UK', 'Cat 2', 105],

    ['FRA', 'Cat 1', 85],
    ['FRA', 'Cat 2', 55],

    ['SPA', 'Cat 1', 60],
    ['SPA', 'Cat 2', 30],
  ],
);

const results1Measure = mockDataResponse([measureName], [[120]]);
const results1MeasureVariant = mockDataResponse([measureName], [[100]]);

const dataset = {
  embeddableId: '',
  datasetId: '',
  inputName: '',
  variableValues: {},
};

export const previewData = {
  dataset,
  dimension,
  dimensionGroup,
  measure,
  results1Measure,
  results1MeasureVariant,
  results1Measure1Dimension,
  results1Measure1DimensionVariant,
  results1Measure2Dimensions,
  results1Measure2DimensionsVariant,
} as const;
