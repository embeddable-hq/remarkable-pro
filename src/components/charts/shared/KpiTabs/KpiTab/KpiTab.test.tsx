import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Measure } from '@embeddable.com/core';
import { KpiTab } from './KpiTab';

const mockDimensionOrMeasureTitle = vi.fn((m: Measure) => m.title);
const mockData = vi.fn((_m: Measure, v: unknown) => `formatted:${v}`);

vi.mock('../../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: () => ({
    dimensionOrMeasureTitle: mockDimensionOrMeasureTitle,
    data: mockData,
  }),
}));

const mockMeasure: Measure = {
  name: 'revenue',
  title: 'Revenue',
  nativeType: 'number',
  inputs: {},
  __type__: 'measure',
};

describe('MeasureTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the formatted measure title', () => {
    render(<KpiTab measure={mockMeasure} value={100} isActive={false} onClick={vi.fn()} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(mockDimensionOrMeasureTitle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'revenue' }),
    );
  });

  it('renders the formatted value when not loading', () => {
    render(<KpiTab measure={mockMeasure} value={42} isActive={false} onClick={vi.fn()} />);

    expect(screen.getByText('formatted:42')).toBeInTheDocument();
  });

  it('renders dash when value is undefined', () => {
    render(<KpiTab measure={mockMeasure} value={undefined} isActive={false} onClick={vi.fn()} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(mockData).not.toHaveBeenCalled();
  });

  it('applies tabActive class when isActive is true', () => {
    render(<KpiTab measure={mockMeasure} value={100} isActive={true} onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('tabActive');
  });

  it('does not apply tabActive class when isActive is false', () => {
    render(<KpiTab measure={mockMeasure} value={100} isActive={false} onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button.className).not.toContain('tabActive');
  });

  it('calls onClick when the button is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<KpiTab measure={mockMeasure} value={100} isActive={false} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
