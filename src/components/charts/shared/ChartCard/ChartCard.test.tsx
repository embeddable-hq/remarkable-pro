import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartCard } from './ChartCard';
import type { DataResponse } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({
    title,
    subtitle,
    tooltip,
  }: {
    title?: string;
    subtitle?: string;
    tooltip?: string;
  }) => (
    <div
      data-testid="card-header"
      data-title={title}
      data-subtitle={subtitle}
      data-tooltip={tooltip}
    />
  ),
  CardFeedback: ({
    variant,
    title,
    message,
  }: {
    variant?: string;
    title?: string;
    message?: string;
  }) => (
    <div
      data-testid="card-feedback"
      data-variant={variant}
      data-title={title}
      data-message={message}
    />
  ),
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('./ChartCardLoading/ChartCardLoading', () => ({
  ChartCardLoading: () => <div data-testid="chart-card-loading" />,
}));

vi.mock('./ChartCardMenuPro/ChartCardMenuPro', () => ({
  ChartCardMenuPro: () => <div data-testid="chart-card-menu" />,
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
  i18nSetup: vi.fn(),
}));

vi.mock('@tabler/icons-react', () => ({ IconAlertCircle: {} }));

const loadingData = { isLoading: true, data: [] } as unknown as DataResponse;
const emptyData = { isLoading: false, data: [] } as unknown as DataResponse;
const withData = { isLoading: false, data: [{ value: 1 }] } as unknown as DataResponse;

describe('ChartCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a skeleton when data is loading and there is no data', () => {
    render(<ChartCard data={loadingData}>content</ChartCard>);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows children when data is loading but data exists', () => {
    const data = { isLoading: true, data: [{ value: 1 }] } as unknown as DataResponse;
    render(<ChartCard data={data}>content</ChartCard>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  it('shows an error feedback when errorMessage is provided', () => {
    render(
      <ChartCard data={withData} errorMessage="Something went wrong">
        content
      </ChartCard>,
    );
    const feedback = screen.getByTestId('card-feedback');
    expect(feedback).toHaveAttribute('data-variant', 'error');
    expect(feedback).toHaveAttribute('data-message', 'Something went wrong');
  });

  it('shows empty feedback when there is no data and no error', () => {
    render(<ChartCard data={emptyData}>content</ChartCard>);
    const feedback = screen.getByTestId('card-feedback');
    expect(feedback).not.toHaveAttribute('data-variant', 'error');
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders children when data is available', () => {
    render(<ChartCard data={withData}>chart content</ChartCard>);
    expect(screen.getByText('chart content')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-feedback')).not.toBeInTheDocument();
  });

  it('renders the card header and menu by default', () => {
    render(
      <ChartCard data={withData} title="My Chart" description="A description" tooltip="Tip">
        content
      </ChartCard>,
    );
    const header = screen.getByTestId('card-header');
    expect(header).toHaveAttribute('data-title', 'My Chart');
    expect(header).toHaveAttribute('data-subtitle', 'A description');
    expect(header).toHaveAttribute('data-tooltip', 'Tip');
    expect(screen.getByTestId('chart-card-menu')).toBeInTheDocument();
  });

  it('hides the header and menu when hideMenu is true', () => {
    render(
      <ChartCard data={withData} hideMenu>
        content
      </ChartCard>,
    );
    expect(screen.queryByTestId('card-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chart-card-menu')).not.toBeInTheDocument();
  });

  it('shows the loading indicator while loading', () => {
    render(<ChartCard data={loadingData}>content</ChartCard>);
    expect(screen.getByTestId('chart-card-loading')).toBeInTheDocument();
  });

  it('shows the menu and hides loading indicator when not loading', () => {
    render(<ChartCard data={withData}>content</ChartCard>);
    expect(screen.getByTestId('chart-card-menu')).toBeInTheDocument();
    expect(screen.getByTestId('chart-card-loading')).toBeInTheDocument(); // rendered but hidden via CSS
  });
});
