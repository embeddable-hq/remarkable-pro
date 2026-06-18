import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FilterBuilderProAndOrButton } from './FilterBuilderProAndOrButton';
import { filterBuilderAndOrOperator } from '../FilterBuilderPro.utils';

vi.mock('../FilterBuilderPro.module.css', () => ({
  default: {
    andOrButton: 'andOrButton',
    andOrButtonSizer: 'andOrButtonSizer',
  },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Tooltip: ({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) => (
    <div data-testid="tooltip">
      {trigger}
      <span data-testid="tooltip-content">{children}</span>
    </div>
  ),
}));

describe('FilterBuilderProAndOrButton', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the active AND label when operator is AND', () => {
    render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.AND} onChange={onChange} />,
    );
    const spans = screen.getAllByText('editors.filterBuilder.and');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('renders the active OR label when operator is OR', () => {
    render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.OR} onChange={onChange} />,
    );
    const spans = screen.getAllByText('editors.filterBuilder.or');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('renders the inactive label aria-hidden for sizing', () => {
    render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.AND} onChange={onChange} />,
    );
    const sizer = document.querySelector('.andOrButtonSizer');
    expect(sizer).toBeInTheDocument();
    expect(sizer).toHaveAttribute('aria-hidden', 'true');
    expect(sizer?.textContent).toBe('editors.filterBuilder.or');
  });

  it('calls onChange with OR when operator is AND and button is clicked', () => {
    render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.AND} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(filterBuilderAndOrOperator.OR);
  });

  it('calls onChange with AND when operator is OR and button is clicked', () => {
    render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.OR} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(filterBuilderAndOrOperator.AND);
  });

  it('does not call onChange when disabled and clicked', () => {
    render(
      <FilterBuilderProAndOrButton
        operator={filterBuilderAndOrOperator.AND}
        onChange={onChange}
        disabled
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the button aria-disabled when disabled', () => {
    render(
      <FilterBuilderProAndOrButton
        operator={filterBuilderAndOrOperator.AND}
        onChange={onChange}
        disabled
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the explanatory tooltip only when disabled', () => {
    const { rerender } = render(
      <FilterBuilderProAndOrButton operator={filterBuilderAndOrOperator.AND} onChange={onChange} />,
    );
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();

    rerender(
      <FilterBuilderProAndOrButton
        operator={filterBuilderAndOrOperator.AND}
        onChange={onChange}
        disabled
      />,
    );
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'editors.filterBuilder.orDisabledMixedTypes',
    );
  });
});
