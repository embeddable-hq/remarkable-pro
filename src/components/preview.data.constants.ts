import { mockDataResponse, mockDimension, mockMeasure } from '@embeddable.com/core';

export const previewDimension = mockDimension('country', 'string', { title: 'Country' });
export const previewMeasure = mockMeasure('users', 'number', { title: 'Users' });

export const previewResults = mockDataResponse(
  ['country', 'users'],
  [
    ['US', 300],
    ['GER', 250],
    ['UK', 200],
    ['FRA', 150],
    ['SPA', 100],
  ],
);
