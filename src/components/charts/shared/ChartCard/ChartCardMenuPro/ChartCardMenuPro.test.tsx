import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartCardMenuPro } from './ChartCardMenuPro';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({
    defaults: {
      chartMenuOptions: [
        { value: 'csv', labelKey: 'export.csv', onClick: vi.fn() },
        { value: 'png', labelKey: 'export.png', onClick: vi.fn() },
        { value: 'pdf', labelKey: 'export.pdf', onClick: vi.fn() },
      ],
    },
  })),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Dropdown: ({
    children,
    triggerComponent,
  }: {
    children: React.ReactNode;
    triggerComponent: React.ReactNode;
  }) => (
    <div data-testid="dropdown">
      {triggerComponent}
      {children}
    </div>
  ),
  ActionIcon: (_props: { icon: unknown }) => <button data-testid="action-icon" />,
  SelectFieldContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-field-content">{children}</div>
  ),
  SelectListOption: ({ label }: { label: string }) => (
    <div data-testid="select-list-option">{label}</div>
  ),
}));

vi.mock('../../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
  i18nSetup: vi.fn(),
}));

vi.mock('@tabler/icons-react', () => ({ IconDotsVertical: {} }));

vi.mock('../ChartCardLoading/ChartCardLoading', () => ({
  ChartCardLoading: () => <div data-testid="chart-card-loading" />,
}));

import { useTheme } from '@embeddable.com/react';

describe('ChartCardMenuPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      defaults: {
        chartMenuOptions: [
          { value: 'csv', labelKey: 'export.csv', onClick: vi.fn() },
          { value: 'png', labelKey: 'export.png', onClick: vi.fn() },
          { value: 'pdf', labelKey: 'export.pdf', onClick: vi.fn() },
        ],
      },
    });
  });

  it('renders all menu options when enabledExportOptions is not provided', () => {
    render(<ChartCardMenuPro />);

    expect(screen.getByText('export.csv')).toBeInTheDocument();
    expect(screen.getByText('export.png')).toBeInTheDocument();
    expect(screen.getByText('export.pdf')).toBeInTheDocument();
  });

  it('renders only the enabled options when enabledExportOptions filters to a subset', () => {
    render(<ChartCardMenuPro enabledExportOptions={['csv', 'png']} />);

    expect(screen.getByText('export.csv')).toBeInTheDocument();
    expect(screen.getByText('export.png')).toBeInTheDocument();
    expect(screen.queryByText('export.pdf')).not.toBeInTheDocument();
  });

  it('renders nothing when enabledExportOptions is an empty array', () => {
    const { container } = render(<ChartCardMenuPro enabledExportOptions={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when theme has no chartMenuOptions', () => {
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      defaults: {},
    });

    const { container } = render(<ChartCardMenuPro />);

    expect(container.firstChild).toBeNull();
  });
});
