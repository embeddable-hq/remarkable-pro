import { isColorValid, setColorAlpha } from './color.utils';

describe('isColorValid', () => {
  it('returns true for a valid hex color', () => {
    expect(isColorValid('#ff0000')).toBe(true);
  });

  it('returns true for a shorthand hex color', () => {
    expect(isColorValid('#f00')).toBe(true);
  });

  it('returns true for an rgb() color', () => {
    expect(isColorValid('rgb(255, 0, 0)')).toBe(true);
  });

  it('returns true for a named CSS color', () => {
    expect(isColorValid('red')).toBe(true);
  });

  it('returns false for an invalid color string', () => {
    expect(isColorValid('notacolor')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isColorValid('')).toBe(false);
  });
});

describe('setColorAlpha', () => {
  it('returns an rgb() string with the given alpha', () => {
    expect(setColorAlpha('#ff0000', 0.5)).toBe('rgb(255 0 0 / 0.5)');
  });

  it('sets alpha to 0 (fully transparent)', () => {
    expect(setColorAlpha('#000000', 0)).toBe('rgb(0 0 0 / 0)');
  });

  it('sets alpha to 1 (fully opaque)', () => {
    expect(setColorAlpha('blue', 1)).toBe('rgb(0 0 255)');
  });

  it('returns the original value for an invalid color', () => {
    expect(setColorAlpha('notacolor', 0.5)).toBe('notacolor');
  });

  it('works with rgb() input', () => {
    expect(setColorAlpha('rgb(0, 128, 0)', 0.8)).toBe('rgb(0 128 0 / 0.8)');
  });
});
