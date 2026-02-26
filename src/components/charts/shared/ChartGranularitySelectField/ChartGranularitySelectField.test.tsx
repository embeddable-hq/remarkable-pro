import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ChartGranularitySelectField } from './ChartGranularitySelectField';
import type { Dimension, Granularity, TimeRange } from '@embeddable.com/core';
import type { GranularitySelectFieldProps } from '../../../editors/shared/GranularitySelectField/GranularitySelectField';

vi.mock('../../../editors/shared/GranularitySelectField/GranularitySelectField', () => ({
  GranularitySelectField: ({
    primaryTimeRange,
    granularity,
    granularities,
    variant,
    side,
    align,
    onChange,
  }: GranularitySelectFieldProps) => (
    <div
      data-testid="granularity-select-field"
      data-primary-time-range={JSON.stringify(primaryTimeRange ?? null)}
      data-granularity={granularity ?? ''}
      data-granularities={JSON.stringify(granularities ?? [])}
      data-variant={variant ?? ''}
      data-side={side ?? ''}
      data-align={align ?? ''}
      onClick={() => onChange('day' as Granularity)}
    />
  ),
}));

const makeDimension = (overrides: Partial<Dimension['inputs']> = {}): Dimension =>
  ({
    inputs: {
      showGranularityDropdown: true,
      dateBounds: undefined,
      granularity: undefined,
      ...overrides,
    },
  }) as unknown as Dimension;

describe('ChartGranularitySelectField', () => {
  describe('when showGranularityDropdown is falsy', () => {
    it('returns null when showGranularityDropdown is false', () => {
      const { container } = render(
        <ChartGranularitySelectField
          dimension={makeDimension({ showGranularityDropdown: false })}
          onChange={vi.fn()}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when showGranularityDropdown is undefined', () => {
      const { container } = render(
        <ChartGranularitySelectField
          dimension={makeDimension({ showGranularityDropdown: undefined })}
          onChange={vi.fn()}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when dimension has no inputs', () => {
      const { container } = render(
        <ChartGranularitySelectField dimension={{} as Dimension} onChange={vi.fn()} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('when showGranularityDropdown is true', () => {
    it('renders the GranularitySelectField', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field')).toBeInTheDocument();
    });

    it('wraps GranularitySelectField in a container div', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field').parentElement).toBeInTheDocument();
    });

    it('applies marginTop class when hasMarginTop is true', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} hasMarginTop onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field').parentElement).toHaveClass('marginTop');
    });

    it('does not apply marginTop class when hasMarginTop is false', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField
          dimension={makeDimension()}
          hasMarginTop={false}
          onChange={vi.fn()}
        />,
      );
      expect(getByTestId('granularity-select-field').parentElement).not.toHaveClass('marginTop');
    });

    it('does not apply marginTop class by default', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field').parentElement).not.toHaveClass('marginTop');
    });

    it('passes dateBounds as primaryTimeRange', () => {
      const dateBounds = { from: new Date('2024-01-01'), to: new Date('2024-12-31') } as TimeRange;
      const { getByTestId } = render(
        <ChartGranularitySelectField
          dimension={makeDimension({ dateBounds })}
          onChange={vi.fn()}
        />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute(
        'data-primary-time-range',
        JSON.stringify(dateBounds),
      );
    });

    it('passes granularity from dimension.inputs', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField
          dimension={makeDimension({ granularity: 'month' as Granularity })}
          onChange={vi.fn()}
        />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute('data-granularity', 'month');
    });

    it('passes the fixed granularities list', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute(
        'data-granularities',
        JSON.stringify(['day', 'week', 'month', 'quarter', 'year']),
      );
    });

    it('passes variant="ghost" to GranularitySelectField', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute('data-variant', 'ghost');
    });

    it('passes side="bottom" to GranularitySelectField', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute('data-side', 'bottom');
    });

    it('passes align="end" to GranularitySelectField', () => {
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={vi.fn()} />,
      );
      expect(getByTestId('granularity-select-field')).toHaveAttribute('data-align', 'end');
    });

    it('forwards onChange to GranularitySelectField', () => {
      const onChange = vi.fn();
      const { getByTestId } = render(
        <ChartGranularitySelectField dimension={makeDimension()} onChange={onChange} />,
      );
      getByTestId('granularity-select-field').click();
      expect(onChange).toHaveBeenCalledWith('day');
    });
  });
});
