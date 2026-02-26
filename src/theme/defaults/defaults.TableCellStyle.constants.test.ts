import { defaultTableCellStyleOptions } from './defaults.TableCellStyle.constants';

const positiveStyles = { background: '#e1f0e9', color: '#0f955a' };
const negativeStyles = { background: '#f6e2e2', color: '#bc1010' };

describe('defaultTableCellStyleOptions', () => {
  it('has 3 options', () => {
    expect(defaultTableCellStyleOptions).toHaveLength(3);
  });

  describe('Bold', () => {
    const bold = defaultTableCellStyleOptions.find((o) => o.value === 'Bold')!;

    it('returns fontWeight bold', () => {
      expect(bold.styles(null)).toEqual({ fontWeight: 'bold' });
    });
  });

  describe('Italic', () => {
    const italic = defaultTableCellStyleOptions.find((o) => o.value === 'Italic')!;

    it('returns fontStyle italic', () => {
      expect(italic.styles(null)).toEqual({ fontStyle: 'italic' });
    });
  });

  describe('Positive vs Negative', () => {
    const pvn = defaultTableCellStyleOptions.find((o) => o.value === 'Positive vs Negative')!;

    it('positive number → positive styles', () => {
      expect(pvn.styles(5)).toEqual(positiveStyles);
    });

    it('negative number → negative styles', () => {
      expect(pvn.styles(-3)).toEqual(negativeStyles);
    });

    it('zero → negative styles', () => {
      expect(pvn.styles(0)).toEqual(negativeStyles);
    });

    it('true boolean → positive styles', () => {
      expect(pvn.styles(true)).toEqual(positiveStyles);
    });

    it('false boolean → negative styles', () => {
      expect(pvn.styles(false)).toEqual(negativeStyles);
    });

    it('numeric string (positive) → positive styles', () => {
      expect(pvn.styles('  42  ')).toEqual(positiveStyles);
    });

    it('numeric string (negative) → negative styles', () => {
      expect(pvn.styles('-1')).toEqual(negativeStyles);
    });

    it('numeric string (zero) → negative styles', () => {
      expect(pvn.styles('0')).toEqual(negativeStyles);
    });

    it('non-numeric string → undefined', () => {
      expect(pvn.styles('hello')).toBeUndefined();
    });

    it('empty string → undefined', () => {
      expect(pvn.styles('')).toBeUndefined();
    });

    it('null → undefined', () => {
      expect(pvn.styles(null)).toBeUndefined();
    });

    it('object → undefined', () => {
      expect(pvn.styles({})).toBeUndefined();
    });
  });
});
