import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useTheme } from '@embeddable.com/react';
import { ThemeComponent } from './ThemeComponent';

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn() }));

const fallback = <div data-testid="fallback" />;

const customLoading = (react: typeof React) => {
  const [label] = react.useState('custom');
  return react.createElement('div', { 'data-testid': 'custom' }, label);
};

describe('ThemeComponent', () => {
  it('shows the fallback when the theme has no custom component', () => {
    vi.mocked(useTheme).mockReturnValue({});
    render(<ThemeComponent name="ChartCardLoading" fallback={fallback} />);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders the theme component with the library React instance', () => {
    vi.mocked(useTheme).mockReturnValue({ components: { ChartCardLoading: customLoading } });
    render(<ThemeComponent name="ChartCardLoading" fallback={fallback} />);
    expect(screen.getByTestId('custom')).toHaveTextContent('custom');
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('unmounts the theme component when the theme removes it', () => {
    const cleanup = vi.fn();
    const withEffect = (react: typeof React) => {
      react.useEffect(() => cleanup, []);
      return null;
    };
    vi.mocked(useTheme).mockReturnValue({ components: { ChartCardLoading: withEffect } });
    const { rerender } = render(<ThemeComponent name="ChartCardLoading" fallback={fallback} />);

    vi.mocked(useTheme).mockReturnValue({});
    rerender(<ThemeComponent name="ChartCardLoading" fallback={fallback} />);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});
