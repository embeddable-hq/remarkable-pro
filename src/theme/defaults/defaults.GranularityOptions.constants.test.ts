import {
  Granularity,
  defaultGranularitySelectFieldOptions,
  granularities,
} from './defaults.GranularityOptions.constants';

describe('Granularity', () => {
  it('has all 8 granularity keys in order', () => {
    expect(Object.keys(Granularity)).toEqual([
      'second',
      'minute',
      'hour',
      'day',
      'week',
      'month',
      'quarter',
      'year',
    ]);
  });
});

describe('defaultGranularitySelectFieldOptions', () => {
  it('has 8 options', () => {
    expect(defaultGranularitySelectFieldOptions).toHaveLength(8);
  });

  it.each([
    ['second', 'defaults.granularityOptions.second|Second'],
    ['minute', 'defaults.granularityOptions.minute|Minute'],
    ['hour', 'defaults.granularityOptions.hour|Hour'],
    ['day', 'defaults.granularityOptions.day|Day'],
    ['week', 'defaults.granularityOptions.week|Week'],
    ['month', 'defaults.granularityOptions.month|Month'],
    ['quarter', 'defaults.granularityOptions.quarter|Quarter'],
    ['year', 'defaults.granularityOptions.year|Year'],
  ] as const)('option %s has correct value and label', (value, label) => {
    const option = defaultGranularitySelectFieldOptions.find((o) => o.value === value);
    expect(option).toBeDefined();
    expect(option!.label).toBe(label);
  });
});

describe('granularities', () => {
  it('contains all 8 granularity values', () => {
    expect(granularities).toHaveLength(8);
    expect(granularities).toEqual(Object.values(Granularity));
  });
});
