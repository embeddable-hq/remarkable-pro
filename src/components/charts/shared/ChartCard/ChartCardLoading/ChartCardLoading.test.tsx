import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ChartCardLoading } from './ChartCardLoading';

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn(() => ({})) }));

vi.mock('@tabler/icons-react', () => ({
  IconLoader2: () => <svg data-testid="default-loading" />,
}));

describe('ChartCardLoading', () => {
  it('shows the default loader when the theme has no custom one', () => {
    render(<ChartCardLoading />);
    expect(screen.getByTestId('default-loading')).toBeInTheDocument();
  });
});
