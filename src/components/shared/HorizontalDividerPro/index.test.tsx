import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HorizontalDividerPro from './index';

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Divider: ({ color, thickness }: { color?: string; thickness?: number }) => (
    <hr data-testid="divider" data-color={color} data-thickness={thickness} />
  ),
}));

vi.mock('./HorizontalDividerPro.module.css', () => ({
  default: { horizontalDividerContainer: 'horizontalDividerContainer' },
}));

describe('HorizontalDividerPro', () => {
  it('renders the container and Divider', () => {
    const { container, getByTestId } = render(<HorizontalDividerPro />);
    expect(container.firstChild).toHaveClass('horizontalDividerContainer');
    expect(getByTestId('divider')).toBeInTheDocument();
  });

  it('passes color and thickness to Divider', () => {
    const { getByTestId } = render(<HorizontalDividerPro color="#ff0000" thickness={2} />);
    const divider = getByTestId('divider');
    expect(divider).toHaveAttribute('data-color', '#ff0000');
    expect(divider).toHaveAttribute('data-thickness', '2');
  });

  it('renders without optional props', () => {
    const { getByTestId } = render(<HorizontalDividerPro />);
    const divider = getByTestId('divider');
    expect(divider).not.toHaveAttribute('data-color');
    expect(divider).not.toHaveAttribute('data-thickness');
  });
});
