import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NativeDataType } from '@embeddable.com/core';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import FilterBuilderItemOperatorValueFields from './FilterBuilderItemOperatorValueFields';
import { operatorNumber, operatorStringBoolean } from '../filters.utils';
import type { FilterBuilderFilter } from '../filters.utils';
import type { FilterBuilderItemValueFieldProps } from './FilterBuilderItemValueField';

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

const mockSingleSelectField = vi.fn();
vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: (props: unknown) => {
    mockSingleSelectField(props);
    const p = props as {
      triggerComponent: React.ReactNode;
      onChange: (v: string) => void;
    };
    return (
      <div data-testid="single-select-field">
        {p.triggerComponent}
        <button data-testid="operator-change" onClick={() => p.onChange('newOperator')} />
      </div>
    );
  },
}));

const mockValueField = vi.fn();
vi.mock('./FilterBuilderItemValueField', () => ({
  default: (props: FilterBuilderItemValueFieldProps) => {
    mockValueField(props);
    return <div data-testid="value-field" />;
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDim = (nativeType: string): DimensionOrMeasure =>
  ({
    name: 'myField',
    title: 'My Field',
    nativeType,
    __type__: 'dimension',
  }) as unknown as DimensionOrMeasure;

const makeFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: makeDim(NativeDataType.string),
  search: '',
  value: 'hello',
  operator: operatorStringBoolean.is,
  ...overrides,
});

const styles = { operatorButton: 'operatorButton' };

const defaultProps = {
  results: undefined,
  theme: {} as never,
  onSelectOperator: vi.fn(),
  onSelectValue: vi.fn(),
  onSearchValue: vi.fn(),
  styles,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FilterBuilderItemOperatorValueFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('operator options by nativeType', () => {
    it('uses string/boolean operators for string type', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: operatorStringBoolean.is })}
        />,
      );
      const { options } = mockSingleSelectField.mock.calls[0]![0] as {
        options: { value: string }[];
      };
      expect(options.map((o) => o.value)).toEqual([
        operatorStringBoolean.is,
        operatorStringBoolean.isNot,
        operatorStringBoolean.isOneOf,
        operatorStringBoolean.isNotOneOf,
        operatorStringBoolean.contains,
      ]);
    });

    it('uses string/boolean operators for boolean type', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.boolean)}
          filter={makeFilter({ operator: operatorStringBoolean.is })}
        />,
      );
      const { options } = mockSingleSelectField.mock.calls[0]![0] as {
        options: { value: string }[];
      };
      expect(options.map((o) => o.value)).toContain(operatorStringBoolean.is);
      expect(options.map((o) => o.value)).not.toContain(operatorNumber.between);
    });

    it('uses number operators for number type', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.number)}
          filter={makeFilter({
            operator: operatorNumber.equals,
            dimensionOrMeasure: makeDim(NativeDataType.number),
          })}
        />,
      );
      const { options } = mockSingleSelectField.mock.calls[0]![0] as {
        options: { value: string }[];
      };
      expect(options.map((o) => o.value)).toEqual([
        operatorNumber.equals,
        operatorNumber.notEquals,
        operatorNumber.gte,
        operatorNumber.lte,
        operatorNumber.between,
      ]);
    });
  });

  describe('useEffect — auto-select first operator', () => {
    it('calls onSelectOperator with the first string operator when operator is null', () => {
      const onSelectOperator = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSelectOperator={onSelectOperator}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: null })}
        />,
      );
      expect(onSelectOperator).toHaveBeenCalledWith(operatorStringBoolean.is);
    });

    it('calls onSelectOperator with the first number operator when operator is null and type is number', () => {
      const onSelectOperator = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSelectOperator={onSelectOperator}
          dimensionOrMeasure={makeDim(NativeDataType.number)}
          filter={makeFilter({
            operator: null,
            dimensionOrMeasure: makeDim(NativeDataType.number),
          })}
        />,
      );
      expect(onSelectOperator).toHaveBeenCalledWith(operatorNumber.equals);
    });

    it('does not call onSelectOperator when operator is already set', () => {
      const onSelectOperator = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSelectOperator={onSelectOperator}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: operatorStringBoolean.isNot })}
        />,
      );
      expect(onSelectOperator).not.toHaveBeenCalled();
    });
  });

  describe('SingleSelectField props', () => {
    it('passes the current operator as value', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: operatorStringBoolean.isNot })}
        />,
      );
      const { value } = mockSingleSelectField.mock.calls[0]![0] as { value: string };
      expect(value).toBe(operatorStringBoolean.isNot);
    });

    it('passes onSelectOperator as onChange', () => {
      const onSelectOperator = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSelectOperator={onSelectOperator}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: operatorStringBoolean.is })}
        />,
      );
      const { onChange } = mockSingleSelectField.mock.calls[0]![0] as {
        onChange: (v: string) => void;
      };
      onChange('newVal');
      expect(onSelectOperator).toHaveBeenCalledWith('newVal');
    });

    it('passes avoidCollisions=false', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter()}
        />,
      );
      const { avoidCollisions } = mockSingleSelectField.mock.calls[0]![0] as {
        avoidCollisions: boolean;
      };
      expect(avoidCollisions).toBe(false);
    });
  });

  describe('operator button label', () => {
    it('shows the label of the currently selected operator', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: operatorStringBoolean.isNot })}
        />,
      );
      // i18n.t returns the key, so label = 'editors.filterBuilder.isNot'
      expect(screen.getByText('editors.filterBuilder.isNot')).toBeInTheDocument();
    });

    it('shows no label text when operator does not match any option', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter({ operator: 'unknown_operator' })}
        />,
      );
      const buttons = screen.getAllByRole('button', { name: '' });
      const operatorBtn = buttons.find((b) => b.classList.contains('operatorButton'));
      expect(operatorBtn).toBeInTheDocument();
      expect(operatorBtn).toBeEmptyDOMElement();
    });
  });

  describe('FilterBuilderItemValueField props', () => {
    it('renders the value field', () => {
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter()}
        />,
      );
      expect(screen.getByTestId('value-field')).toBeInTheDocument();
    });

    it('passes filter to value field', () => {
      const filter = makeFilter({ operator: operatorStringBoolean.contains });
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={filter}
        />,
      );
      expect(mockValueField.mock.calls[0]![0].filter).toBe(filter);
    });

    it('passes dimensionOrMeasure to value field', () => {
      const dim = makeDim(NativeDataType.string);
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          dimensionOrMeasure={dim}
          filter={makeFilter()}
        />,
      );
      expect(mockValueField.mock.calls[0]![0].dimensionOrMeasure).toBe(dim);
    });

    it('passes results to value field', () => {
      const results = { data: [], isLoading: false } as never;
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          results={results}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter()}
        />,
      );
      expect(mockValueField.mock.calls[0]![0].results).toBe(results);
    });

    it('passes onSelectValue to value field', () => {
      const onSelectValue = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSelectValue={onSelectValue}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter()}
        />,
      );
      expect(mockValueField.mock.calls[0]![0].onSelectValue).toBe(onSelectValue);
    });

    it('passes onSearchValue to value field', () => {
      const onSearchValue = vi.fn();
      render(
        <FilterBuilderItemOperatorValueFields
          {...defaultProps}
          onSearchValue={onSearchValue}
          dimensionOrMeasure={makeDim(NativeDataType.string)}
          filter={makeFilter()}
        />,
      );
      expect(mockValueField.mock.calls[0]![0].onSearchValue).toBe(onSearchValue);
    });
  });
});
