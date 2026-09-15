import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartCardMenuPro, InlineSvgFromData } from './ChartCardMenuPro';

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
  SelectListOption: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <div data-testid="select-list-option" onClick={onClick}>
      {label}
    </div>
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

describe('InlineSvgFromData', () => {
  it('decodes and renders an SVG from a data URL', () => {
    const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const encoded = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

    const { container } = render(<InlineSvgFromData src={encoded} />);

    expect(container.querySelector('div')).toBeTruthy();
    expect(container.innerHTML).toContain('circle');
  });

  it('forwards className and extra props to the wrapper div', () => {
    const { container } = render(
      <InlineSvgFromData
        src="data:image/svg+xml,%3Csvg%2F%3E"
        className="icon"
        data-testid="svg-wrapper"
      />,
    );

    expect(container.querySelector('.icon')).toBeTruthy();
    expect(container.querySelector('[data-testid="svg-wrapper"]')).toBeTruthy();
  });
});

describe('ChartCardMenuPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({ defaults: {} });
  });

  it('renders the provided menu options', () => {
    render(
      <ChartCardMenuPro
        menuOptions={[
          { value: 'csv', labelKey: 'export.csv', onClick: vi.fn() },
          { value: 'png', labelKey: 'export.png', onClick: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByText('export.csv')).toBeInTheDocument();
    expect(screen.getByText('export.png')).toBeInTheDocument();
  });

  it('renders nothing when menuOptions is an empty array', () => {
    const { container } = render(<ChartCardMenuPro menuOptions={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('calls the option onClick with theme and props when an option is clicked', async () => {
    vi.useFakeTimers();
    const onClickMock = vi.fn().mockResolvedValue(undefined);

    render(
      <ChartCardMenuPro
        title="My Chart"
        menuOptions={[{ value: 'csv', labelKey: 'export.csv', onClick: onClickMock }]}
      />,
    );
    fireEvent.click(screen.getByText('export.csv'));

    await vi.runAllTimersAsync();

    expect(onClickMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Chart' }));
    vi.useRealTimers();
  });

  it('calls onCustomDownload instead of onClick directly when provided', async () => {
    vi.useFakeTimers();
    const onClickMock = vi.fn().mockResolvedValue(undefined);
    const onCustomDownload = vi.fn((cb) => cb({ title: 'custom' }));

    render(
      <ChartCardMenuPro
        onCustomDownload={onCustomDownload}
        menuOptions={[{ value: 'csv', labelKey: 'export.csv', onClick: onClickMock }]}
      />,
    );
    fireEvent.click(screen.getByText('export.csv'));

    await vi.runAllTimersAsync();

    expect(onCustomDownload).toHaveBeenCalled();
    expect(onClickMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'custom' }));
    vi.useRealTimers();
  });

  it('runs instant action options immediately, without loading state or onCustomDownload', () => {
    const onClickMock = vi.fn();
    const onCustomDownload = vi.fn();

    render(
      <ChartCardMenuPro
        onCustomDownload={onCustomDownload}
        menuOptions={[
          { value: 'maximize', labelKey: 'maximize', isInstantAction: true, onClick: onClickMock },
        ]}
      />,
    );
    fireEvent.click(screen.getByText('maximize'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(onCustomDownload).not.toHaveBeenCalled();
    expect(screen.queryByTestId('chart-card-loading')).not.toBeInTheDocument();
  });

  it('shows loading state while export is in progress', async () => {
    vi.useFakeTimers();
    let resolveExport!: () => void;
    const onClickMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        }),
    );

    render(
      <ChartCardMenuPro
        menuOptions={[{ value: 'csv', labelKey: 'export.csv', onClick: onClickMock }]}
      />,
    );
    fireEvent.click(screen.getByText('export.csv'));

    await vi.advanceTimersByTimeAsync(150);

    expect(screen.getByTestId('chart-card-loading')).toBeInTheDocument();

    await act(async () => {
      resolveExport();
      await vi.runAllTimersAsync();
    });

    expect(screen.queryByTestId('chart-card-loading')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
