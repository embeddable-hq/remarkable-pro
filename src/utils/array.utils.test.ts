import { sortArrayByProp } from './array.utils';

describe('sortArrayByProp', () => {
  const people = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
  ];

  it('sorts strings ascending by default', () => {
    const result = sortArrayByProp(people, 'name');
    expect(result.map((x) => x.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts strings descending', () => {
    const result = sortArrayByProp(people, 'name', 'desc');
    expect(result.map((x) => x.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts numbers ascending', () => {
    const result = sortArrayByProp(people, 'age');
    expect(result.map((x) => x.age)).toEqual([25, 30, 35]);
  });

  it('sorts numbers descending', () => {
    const result = sortArrayByProp(people, 'age', 'desc');
    expect(result.map((x) => x.age)).toEqual([35, 30, 25]);
  });

  it('does not mutate the original array', () => {
    const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
    const copy = [...arr];
    sortArrayByProp(arr, 'v');
    expect(arr).toEqual(copy);
  });

  it('handles equal values without throwing', () => {
    const arr = [{ v: 1 }, { v: 1 }, { v: 1 }];
    const result = sortArrayByProp(arr, 'v');
    expect(result).toHaveLength(3);
  });

  it('handles empty array', () => {
    expect(sortArrayByProp([], 'name' as never)).toEqual([]);
  });
});
