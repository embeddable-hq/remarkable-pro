import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MeasureTab } from './MeasureTab';
import type { Measure } from '@embeddable.com/core';
import type { Theme } from '../../../../../theme/theme.types';

const mockDimensionOrMeasureTitle = vi.fn((m: Measure) => m.title);
const mockData = vi.fn((_m: Measure, v: unknown) => `formatted:${v}`);

vi.mock('../../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: () => ({
    dimensionOrMeasureTitle: mockDimensionOrMeasureTitle,
    data: mockData,
  }),
}));

const makeMeasure = (overrides: Partial<Measure> = {}): Measure =>
  ({
    name: 'revenue',
    title: 'Revenue',
    nativeType: 'number',
    inputs: {},
    ...overrides,
  }) as unknown as Measure;

const theme = {} as Theme;

describe('MeasureTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the formatted measure title', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={100}
        isActive={false}
        isLoading={false}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(mockDimensionOrMeasureTitle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'revenue' }),
    );
  });

  it('renders the formatted value when not loading', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={42}
        isActive={false}
        isLoading={false}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByText('formatted:42')).toBeInTheDocument();
  });

  it('renders empty string when value is undefined', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={undefined}
        isActive={false}
        isLoading={false}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    const valueSpans = screen
      .getAllByText('', { exact: true })
      .filter((el) => el.className === 'tabValue');
    expect(valueSpans).toHaveLength(1);
    expect(mockData).not.toHaveBeenCalled();
  });

  it('hides the value span when isLoading is true', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={100}
        isActive={false}
        isLoading={true}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.queryByText('formatted:100')).not.toBeInTheDocument();
  });

  it('applies tabActive class when isActive is true', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={100}
        isActive={true}
        isLoading={false}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('tabActive');
  });

  it('does not apply tabActive class when isActive is false', () => {
    render(
      <MeasureTab
        measure={makeMeasure()}
        value={100}
        isActive={false}
        isLoading={false}
        onClick={vi.fn()}
        theme={theme}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.className).not.toContain('tabActive');
  });

  it('calls onClick when the button is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <MeasureTab
        measure={makeMeasure()}
        value={100}
        isActive={false}
        isLoading={false}
        onClick={onClick}
        theme={theme}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
