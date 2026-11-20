import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DateRangePickerPresetsPro from './index';
import {
  getDateRangeFromTimeRange,
  getTimeRangeFromPresets,
  getTimeRangeLabel,
} from '../dates.utils';
import { getDateRangeSelectFieldProOptions } from './DateRangePickerPresetsPro.utils';

const theme = {
  i18n: { language: 'en' },
  formatter: { locale: 'en' },
  clientContext: { timezone: 'UTC' },
  defaults: { dateRangesOptions: [], weekStartsOn: 0 },
};

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => theme),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
  i18nSetup: vi.fn(),
}));

vi.mock('../../../../utils/date.utils', () => ({
  useLoadDayjsLocale: () => ({ dayjsLocaleReady: true }),
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('../../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../dates.utils', () => ({
  getDateRangeFromTimeRange: vi.fn(),
  getTimeRangeFromDateRange: vi.fn(),
  getTimeRangeFromPresets: vi.fn((timeRange: unknown) => timeRange),
  getTimeRangeLabel: vi.fn(() => 'range label'),
}));

vi.mock('./DateRangePickerPresetsPro.utils', () => ({
  getDateRangeSelectFieldProOptions: vi.fn(() => [{ value: 'This week', label: 'This week' }]),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Button: () => null,
  DateRangePicker: () => null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Dropdown: ({ triggerComponent, children, onOpenChange }: Record<string, any>) => (
    <div>
      {triggerComponent}
      <button onClick={() => onOpenChange(false)}>close</button>
      {children}
    </div>
  ),
  SelectFieldTrigger: ({ valueLabel }: { valueLabel: string }) => <span>{valueLabel}</span>,
  SelectFieldContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectFieldContentList: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectListOption: ({ label, onClick }: Record<string, any>) => (
    <button onClick={() => onClick?.({ preventDefault: () => undefined })}>{label}</button>
  ),
  isSameDateRange: () => true,
  shallowEqual: () => true,
}));

const selectedValue = {
  from: new Date('2026-11-15T00:00:00.000Z'),
  to: new Date('2026-11-21T23:59:59.999Z'),
  relativeTimeString: '',
};

describe('DateRangePickerPresetsPro', () => {
  it('passes the theme weekStartsOn to every date range calculation', () => {
    const onChange = vi.fn();
    render(
      <DateRangePickerPresetsPro
        onChange={onChange}
        selectedValue={selectedValue}
        showCustomRangeOptions
      />,
    );

    expect(screen.getByText('range label')).toBeTruthy();
    expect(getTimeRangeLabel).toHaveBeenCalledWith(selectedValue, 'MMM DD', [], 'UTC', 0);
    expect(getDateRangeFromTimeRange).toHaveBeenCalledWith(selectedValue, [], 'UTC', 0);
    expect(getTimeRangeFromPresets).toHaveBeenCalledWith(selectedValue, [], 'UTC', 0);
    expect(getDateRangeSelectFieldProOptions).toHaveBeenCalledWith([], 'UTC', 0);

    fireEvent.click(screen.getByText('This week'));
    expect(getTimeRangeFromPresets).toHaveBeenCalledWith(
      { relativeTimeString: 'This week' },
      [],
      'UTC',
      0,
    );
    expect(onChange).toHaveBeenCalledWith({ relativeTimeString: 'This week' });

    vi.mocked(getDateRangeFromTimeRange).mockClear();
    fireEvent.click(screen.getByText('close'));
    expect(getDateRangeFromTimeRange).toHaveBeenCalledWith(selectedValue, [], 'UTC', 0);
  });
});
