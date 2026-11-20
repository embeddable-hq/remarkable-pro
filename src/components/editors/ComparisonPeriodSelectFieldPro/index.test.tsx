import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ComparisonPeriodSelectFieldPro from './index';
import { getTimeRangeFromPresets } from '../dates/dates.utils';
import { getComparisonPeriodSelectFieldProOptions } from './ComparisonPeriodSelectFieldPro.utils';

const theme = {
  i18n: { language: 'en' },
  formatter: { locale: 'en' },
  clientContext: { timezone: 'UTC' },
  defaults: { dateRangesOptions: [], comparisonPeriodsOptions: [], weekStartsOn: 0 },
};

const primaryRange = { from: undefined, to: undefined, relativeTimeString: 'This week' };
const resolvedRange = {
  from: new Date('2026-11-15T00:00:00.000Z'),
  to: new Date('2026-11-21T23:59:59.999Z'),
  relativeTimeString: 'This week',
};

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => theme),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
  i18nSetup: vi.fn(),
}));

vi.mock('../../../utils/date.utils', () => ({
  useLoadDayjsLocale: () => ({ dayjsLocaleReady: true }),
}));

vi.mock('../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../dates/dates.utils', () => ({
  getTimeRangeFromPresets: vi.fn(() => resolvedRange),
}));

vi.mock('./ComparisonPeriodSelectFieldPro.utils', () => ({
  getComparisonPeriodSelectFieldProOptions: vi.fn(() => []),
  isComparisonPeriodAvailable: vi.fn(() => true),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: () => null,
}));

describe('ComparisonPeriodSelectFieldPro', () => {
  it('passes the theme weekStartsOn to the primary range and the options', () => {
    render(
      <ComparisonPeriodSelectFieldPro
        onChange={vi.fn()}
        primaryDateRange={primaryRange}
        comparisonPeriod="Previous week"
      />,
    );

    expect(getTimeRangeFromPresets).toHaveBeenCalledWith(primaryRange, [], 'UTC', 0);
    expect(getComparisonPeriodSelectFieldProOptions).toHaveBeenCalledWith([], resolvedRange, 0);
  });
});
