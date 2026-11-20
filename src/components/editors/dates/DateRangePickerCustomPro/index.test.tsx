import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DateRangePickerCustomPro from './index';
import { getDateRangeFromTimeRange, getTimeRangeLabel } from '../dates.utils';

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
  getTimeRangeLabel: vi.fn(() => 'range label'),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  DateRangePickerField: ({ displayValue }: { displayValue: string }) => <span>{displayValue}</span>,
}));

describe('DateRangePickerCustomPro', () => {
  it('passes the theme weekStartsOn to the label and the picker value', () => {
    const selectedValue = { from: undefined, to: undefined, relativeTimeString: 'This week' };
    render(<DateRangePickerCustomPro onChange={vi.fn()} selectedValue={selectedValue} />);

    expect(screen.getByText('range label')).toBeTruthy();
    expect(getTimeRangeLabel).toHaveBeenCalledWith(selectedValue, 'MMM DD', [], 'UTC', 0);
    expect(getDateRangeFromTimeRange).toHaveBeenCalledWith(selectedValue, [], 'UTC', 0);
  });
});
