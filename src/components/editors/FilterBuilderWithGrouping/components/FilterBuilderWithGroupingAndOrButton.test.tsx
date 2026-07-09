import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { FilterBuilderWithGroupingAndOrButton } from './FilterBuilderWithGroupingAndOrButton';
import { filterBuilderAndOrOperator } from '../../utils/filterBuilder.utils';

vi.mock('../FilterBuilderWithGrouping.module.css', () => ({
  default: {
    andOrButton: 'andOrButton',
    andOrButtonInGroup: 'andOrButtonInGroup',
    andOrButtonSizer: 'sizer',
  },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn((k: string) => k) } }));

vi.mock('@embeddable.com/remarkable-ui', async () => {
  const { TooltipMock } = await import('../test-utils');
  return { Tooltip: TooltipMock };
});

describe('FilterBuilderWithGroupingAndOrButton', () => {
  it('toggles AND -> OR on click', () => {
    const onChange = vi.fn();
    render(
      <FilterBuilderWithGroupingAndOrButton
        operator={filterBuilderAndOrOperator.AND}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(filterBuilderAndOrOperator.OR);
  });

  it('shows the tooltip and is disabled when disabled', () => {
    render(
      <FilterBuilderWithGroupingAndOrButton
        operator={filterBuilderAndOrOperator.AND}
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'editors.filterBuilder.disableOrOperatorToolTip',
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies the in-group modifier class', () => {
    render(
      <FilterBuilderWithGroupingAndOrButton
        operator={filterBuilderAndOrOperator.OR}
        onChange={vi.fn()}
        inGroup
      />,
    );
    expect(screen.getByRole('button').className).toContain('andOrButtonInGroup');
  });
});
