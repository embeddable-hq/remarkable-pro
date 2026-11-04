import { describe, expect, it } from 'vitest';
import { getResultsPagingArgs, isAutoHeight } from './TableScrollable.autoHeight';

const PAGE_SIZE = 50;
const MAX_RESULTS = 1000;

describe('isAutoHeight', () => {
  it('is true only for the auto mode', () => {
    expect(isAutoHeight('auto')).toBe(true);
    expect(isAutoHeight('fixed')).toBe(false);
    expect(isAutoHeight(undefined)).toBe(false);
  });
});

describe('getResultsPagingArgs', () => {
  it('walks the dataset a page at a time in fixed height', () => {
    expect(getResultsPagingArgs('fixed', 2, PAGE_SIZE, MAX_RESULTS)).toEqual({
      offset: 100,
      limit: PAGE_SIZE,
    });
  });

  it('takes the whole allowance and asks for the row count in auto height', () => {
    expect(getResultsPagingArgs('auto', 2, PAGE_SIZE, MAX_RESULTS)).toEqual({
      offset: 0,
      limit: MAX_RESULTS,
      countRows: true,
    });
  });

  it('pages as before when no mode has reached the state yet', () => {
    expect(getResultsPagingArgs(undefined, 1, PAGE_SIZE, MAX_RESULTS)).toEqual({
      offset: PAGE_SIZE,
      limit: PAGE_SIZE,
    });
  });

  it('leaves the limit to the platform when the input is unset', () => {
    expect(getResultsPagingArgs('auto', 0, PAGE_SIZE, undefined)).toEqual({
      offset: 0,
      limit: undefined,
      countRows: true,
    });
  });
});
