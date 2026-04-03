import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MeasureTabs } from './MeasureTabs';
import type { DataResponse, Measure } from '@embeddable.com/core';
import type { Theme } from '../../../../../theme/theme.types';

const mockScrollRef = { current: null };
const mockHandleScrollLeft = vi.fn();
const mockHandleScrollRight = vi.fn();
let mockCanScrollLeft = false;
let mockCanScrollRight = false;

vi.mock('../../../../horizontalScroll.hooks', () => ({
  useHorizontalScroll: () => ({
    scrollRef: mockScrollRef,
    canScrollLeft: mockCanScrollLeft,
    canScrollRight: mockCanScrollRight,
    handleScrollLeft: mockHandleScrollLeft,
    handleScrollRight: mockHandleScrollRight,
  }),
}));

vi.mock('./MeasureTab', () => ({
  MeasureTab: (props: {
    measure: Measure;
    value: unknown;
    isActive: boolean;
    isLoading: boolean;
    onClick: () => void;
  }) => (
    <button
      data-testid={`tab-${props.measure.name}`}
      data-active={props.isActive}
      data-loading={props.isLoading}
      data-value={props.value ?? 'undefined'}
      onClick={props.onClick}
    >
      {props.measure.title}
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

const makeResultsTotals = (
  data: Record<string, unknown>[] | undefined,
  isLoading: boolean,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

const theme = {} as Theme;

describe('MeasureTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanScrollLeft = false;
    mockCanScrollRight = false;
  });

  it('renders a MeasureTab for each measure', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([{ revenue: 100, cost: 50 }], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('tab-revenue')).toBeInTheDocument();
    expect(screen.getByTestId('tab-cost')).toBeInTheDocument();
  });

  it('passes correct isActive based on activeMeasureIndex', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([{ revenue: 100, cost: 50 }], false)}
        activeMeasureIndex={1}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('tab-revenue')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('tab-cost')).toHaveAttribute('data-active', 'true');
  });

  it('passes correct value from resultsTotals.data[0]', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([{ revenue: 200, cost: 75 }], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('tab-revenue')).toHaveAttribute('data-value', '200');
    expect(screen.getByTestId('tab-cost')).toHaveAttribute('data-value', '75');
  });

  it('passes isLoading true when resultsTotals is loading', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals(undefined, true)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('tab-revenue')).toHaveAttribute('data-loading', 'true');
  });

  it('passes isLoading false when resultsTotals has data', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([{ revenue: 100 }], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('tab-revenue')).toHaveAttribute('data-loading', 'false');
  });

  it('shows left scroll button when canScrollLeft is true', () => {
    mockCanScrollLeft = true;

    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument();
  });

  it('shows right scroll button when canScrollRight is true', () => {
    mockCanScrollRight = true;

    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
  });

  it('hides scroll buttons when scroll is not needed', () => {
    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    expect(screen.queryByTestId('icon-chevron-left')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-chevron-right')).not.toBeInTheDocument();
  });

  it('calls onTabClick with correct index when a tab is clicked', async () => {
    const onTabClick = vi.fn();
    const user = userEvent.setup();

    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([{ revenue: 100, cost: 50 }], false)}
        activeMeasureIndex={0}
        onTabClick={onTabClick}
        theme={theme}
      />,
    );

    await user.click(screen.getByTestId('tab-cost'));
    expect(onTabClick).toHaveBeenCalledWith(1);
  });

  it('calls handleScrollLeft when left scroll button is clicked', async () => {
    mockCanScrollLeft = true;
    const user = userEvent.setup();

    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    await user.click(screen.getByTestId('icon-chevron-left').closest('button')!);
    expect(mockHandleScrollLeft).toHaveBeenCalledTimes(1);
  });

  it('calls handleScrollRight when right scroll button is clicked', async () => {
    mockCanScrollRight = true;
    const user = userEvent.setup();

    render(
      <MeasureTabs
        measures={measures}
        resultsTotals={makeResultsTotals([], false)}
        activeMeasureIndex={0}
        onTabClick={vi.fn()}
        theme={theme}
      />,
    );

    await user.click(screen.getByTestId('icon-chevron-right').closest('button')!);
    expect(mockHandleScrollRight).toHaveBeenCalledTimes(1);
  });
});
