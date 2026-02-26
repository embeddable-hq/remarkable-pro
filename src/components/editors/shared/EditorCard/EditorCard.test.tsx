import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EditorCard } from './EditorCard';

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn().mockReturnValue({}) }));
vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn((key: string) => key) },
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
    variant: string;
    title: string;
    message: string;
    icon: unknown;
  }) => (
    <div data-testid="card-feedback" data-variant={variant} data-title={title}>
      {message}
    </div>
  ),
}));
vi.mock('@tabler/icons-react', () => ({ IconAlertCircle: {} }));

describe('EditorCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no errorMessage is provided', () => {
    render(
      <EditorCard>
        <span>child content</span>
      </EditorCard>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('does not render CardFeedback when there is no errorMessage', () => {
    render(
      <EditorCard>
        <span>child</span>
      </EditorCard>,
    );
    expect(screen.queryByTestId('card-feedback')).not.toBeInTheDocument();
  });

  it('renders CardFeedback with error variant when errorMessage is provided', () => {
    render(
      <EditorCard errorMessage="Something went wrong">
        <span>child</span>
      </EditorCard>,
    );
    const feedback = screen.getByTestId('card-feedback');
    expect(feedback).toBeInTheDocument();
    expect(feedback).toHaveAttribute('data-variant', 'error');
  });

  it('displays the errorMessage in CardFeedback', () => {
    render(
      <EditorCard errorMessage="Something went wrong">
        <span>child</span>
      </EditorCard>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render children when errorMessage is provided', () => {
    render(
      <EditorCard errorMessage="error">
        <span>child content</span>
      </EditorCard>,
    );
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  it('passes title, description, and tooltip to CardHeader', () => {
    render(
      <EditorCard title="My Title" description="My Description" tooltip="My Tooltip">
        <span>child</span>
      </EditorCard>,
    );
    const header = screen.getByTestId('card-header');
    expect(header).toHaveAttribute('data-title', 'My Title');
    expect(header).toHaveAttribute('data-subtitle', 'My Description');
    expect(header).toHaveAttribute('data-tooltip', 'My Tooltip');
  });

  it('renders the Card wrapper', () => {
    render(
      <EditorCard>
        <span>child</span>
      </EditorCard>,
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders CardHeader even when title is not provided', () => {
    render(
      <EditorCard>
        <span>child</span>
      </EditorCard>,
    );
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
  });
});
