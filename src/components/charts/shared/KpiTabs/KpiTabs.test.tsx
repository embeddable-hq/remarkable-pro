import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { KpiTabs } from './KpiTabs';
import type { Measure } from '@embeddable.com/core';

const mockHandleScrollLeft = vi.fn();
const mockHandleScrollRight = vi.fn();
let mockCanScrollLeft = false;
let mockCanScrollRight = false;

vi.mock('../../../../hooks/useHorizontalScroll.hooks', () => ({
  useHorizontalScroll: () => ({
    scrollRef: { current: null },
    canScrollLeft: mockCanScrollLeft,
    canScrollRight: mockCanScrollRight,
    handleScrollLeft: mockHandleScrollLeft,
    handleScrollRight: mockHandleScrollRight,
  }),
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: () => ({
    dimensionOrMeasureTitle: (m: Measure) => m.title,
    data: (_m: Measure, v: unknown) => `${v}`,
  }),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  ActionIcon: ({ icon: Icon, onClick }: { icon: React.ComponentType; onClick: () => void }) => (
    <button onClick={onClick}>
      <Icon />
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconChevronLeft: () => <span data-testid="icon-chevron-left" />,
  IconChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

const makeMeasure = (name: string, title: string): Measure =>
  ({ name, title, nativeType: 'number', inputs: {} }) as unknown as Measure;

const measures = [makeMeasure('revenue', 'Revenue'), makeMeasure('cost', 'Cost')];
const kpiValues = { revenue: 100, cost: 50 };

describe('KpiTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanScrollLeft = false;
    mockCanScrollRight = false;
  });

  it('renders a tab for each measure', () => {
    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /revenue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cost/i })).toBeInTheDocument();
  });

  it('applies tabActive class only to the active tab', () => {
    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="cost"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /revenue/i }).className).not.toContain('tabActive');
    expect(screen.getByRole('button', { name: /cost/i }).className).toContain('tabActive');
  });

  it('displays the formatted kpi value for each tab', () => {
    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('displays "-" when kpiValues is undefined', () => {
    render(
      <KpiTabs
        measures={measures}
        kpiValues={undefined}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('calls onChange with the measure name when a tab is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cost/i }));
    expect(onChange).toHaveBeenCalledWith('cost');
  });

  it('shows left scroll button when canScrollLeft is true', () => {
    mockCanScrollLeft = true;

    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument();
  });

  it('shows right scroll button when canScrollRight is true', () => {
    mockCanScrollRight = true;

    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
  });

  it('hides scroll buttons when scroll is not needed', () => {
    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('icon-chevron-left')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-chevron-right')).not.toBeInTheDocument();
  });

  it('calls handleScrollLeft when left scroll button is clicked', async () => {
    mockCanScrollLeft = true;
    const user = userEvent.setup();

    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('icon-chevron-left').closest('button')!);
    expect(mockHandleScrollLeft).toHaveBeenCalledTimes(1);
  });

  it('calls handleScrollRight when right scroll button is clicked', async () => {
    mockCanScrollRight = true;
    const user = userEvent.setup();

    render(
      <KpiTabs
        measures={measures}
        kpiValues={kpiValues}
        activeMeasureName="revenue"
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('icon-chevron-right').closest('button')!);
    expect(mockHandleScrollRight).toHaveBeenCalledTimes(1);
  });
});
