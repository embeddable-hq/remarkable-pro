import { CSSProperties } from 'react';

export type TableCellStyleOption = {
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: (value: any) => CSSProperties | undefined;
};

const positiveStyles = { background: '#e1f0e9', color: '#0f955a' };
const negativeStyles = { background: '#f6e2e2', color: '#bc1010' };

export const defaultTableCellStyleOptions: TableCellStyleOption[] = [
  {
    value: 'Bold',
    styles: (_value: unknown) => {
      return { fontWeight: 'bold' };
    },
  },
  {
    value: 'Italic',
    styles: (_value: unknown) => {
      return { fontStyle: 'italic' };
    },
  },
  {
    value: 'Positive vs Negative',
    styles: (value: unknown) => {
      if (typeof value === 'number') {
        return value > 0 ? positiveStyles : negativeStyles; // 0 -> negative
      }

      if (typeof value === 'boolean') {
        return value ? positiveStyles : negativeStyles;
      }

      if (typeof value === 'string') {
        const s = value.trim();
        if (s !== '' && Number.isFinite(Number(s))) {
          const n = Number(s);
          return n > 0 ? positiveStyles : negativeStyles;
        }
      }

      return undefined;
    },
  },
];
