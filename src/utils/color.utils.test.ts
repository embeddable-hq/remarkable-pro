import { getColorGradient, isColorValid, setColorAlpha } from './color.utils';

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

describe('getColorGradient', () => {
  it('returns just the start color for a single step', () => {
    expect(getColorGradient('#FBC02D', '#6A1A9A', 1)).toEqual(['#FBC02D']);
  });

  it('returns the start and end color for two steps', () => {
    const colors = getColorGradient('#FBC02D', '#6A1A9A', 2);
    expect(colors).toHaveLength(2);
    expect(colors[0]?.toLowerCase()).toBe('#fbc02d');
    expect(colors[1]?.toLowerCase()).toBe('#6a1a9a');
  });

  it('returns the requested number of intermediate steps', () => {
    const colors = getColorGradient('#FBC02D', '#6A1A9A', 4);
    expect(colors).toHaveLength(4);
    colors.forEach((color) => expect(isColorValid(color)).toBe(true));
  });
});
