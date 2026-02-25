import { getObjectStableKey } from './object.utils';

describe('getObjectStableKey', () => {
  it('returns the same key for the same object', () => {
    const obj = { a: 1, b: 2 };
    expect(getObjectStableKey(obj)).toBe(getObjectStableKey(obj));
  });

  it('returns the same key regardless of property order', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(getObjectStableKey(obj1)).toBe(getObjectStableKey(obj2));
  });

  it('returns different keys for different objects', () => {
    expect(getObjectStableKey({ a: 1 })).not.toBe(getObjectStableKey({ a: 2 }));
  });

  it('returns the same key for identical arrays', () => {
    expect(getObjectStableKey([1, 2, 3])).toBe(getObjectStableKey([1, 2, 3]));
  });

  it('returns different keys for different arrays', () => {
    expect(getObjectStableKey([1, 2])).not.toBe(getObjectStableKey([1, 3]));
  });

  it('handles nested objects with key order independence', () => {
    const obj1 = { a: { c: 3, b: 2 } };
    const obj2 = { a: { b: 2, c: 3 } };
    expect(getObjectStableKey(obj1)).toBe(getObjectStableKey(obj2));
  });

  it('handles primitive values', () => {
    expect(getObjectStableKey(42)).toBe(getObjectStableKey(42));
    expect(getObjectStableKey('hello')).toBe(getObjectStableKey('hello'));
    expect(getObjectStableKey(null)).toBe(getObjectStableKey(null));
  });

  it('returns different keys for different primitives', () => {
    expect(getObjectStableKey(1)).not.toBe(getObjectStableKey(2));
  });

  it('returns a lowercase hex string', () => {
    const key = getObjectStableKey({ a: 1 });
    expect(key).toMatch(/^[0-9a-f]+$/);
  });
});
