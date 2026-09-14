import { describe, it, expect, vi } from 'vitest';
import type { Measure, TimeRange } from '@embeddable.com/core';

// Mock UI deps so importing the definition doesn't load real CSS-bundled packages.
vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
  definePreview: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn(() => '') },
}));

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: () => null,
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  KpiChart: () => null,
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({ data: vi.fn(() => '') })),
}));

vi.mock('../kpis.utils', () => ({
  getKpiResults: vi.fn((results) => results),
}));

vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(() => ({})),
  getComparisonPeriodLabel: vi.fn(() => ''),
}));

// Left un-mocked: it's the logic under test.
const { kpiChartNumberComparisonPro } = await import('./definition');

describe('KpiChartNumberComparisonPro definition', () => {
  it('exposes "Reverse trend direction" as its own input, separate from the colors toggle', () => {
    const reverseTrendDirectionInput = kpiChartNumberComparisonPro.meta.inputs.find(
      (input) => input.name === 'reverseTrendDirection',
    );
    const reversePositiveNegativeColorsInput = kpiChartNumberComparisonPro.meta.inputs.find(
      (input) => input.name === 'reversePositiveNegativeColors',
    );

    expect(reverseTrendDirectionInput).toBeDefined();
    expect(reverseTrendDirectionInput?.label).toBe('Reverse trend direction');
    expect(reversePositiveNegativeColorsInput?.label).toBe('Reverse positive/negative colors');

    // No static defaultValue, so config.props can tell "unset" from "explicitly false".
    expect(reverseTrendDirectionInput).not.toHaveProperty('defaultValue');
  });

  describe('config.props backwards compatibility', () => {
    const measure = { name: 'revenue', inputs: {} } as unknown as Measure;
    const dateRange = {} as unknown as TimeRange;

    const baseInputs = {
      dataset: 'ds1',
      measure,
      timeProperty: undefined,
      primaryDateRange: dateRange,
      comparisonPeriod: 'Previous period',
      title: undefined,
      description: undefined,
      tooltip: undefined,
      displayNullAs: undefined,
      displayChangeAsPercentage: false,
      percentageDecimalPlaces: 1,
      fontSize: undefined,
      changeFontSize: undefined,
      menuOptions: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const callProps = (overrides: Record<string, unknown>) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (kpiChartNumberComparisonPro.config.props as any)(
        { ...baseInputs, ...overrides },
        [undefined, () => undefined],
        {},
      );

    it('mirrors an existing FALSE colors config onto the new field when it was never configured', () => {
      const props = callProps({
        reversePositiveNegativeColors: false,
        reverseTrendDirection: undefined,
      });
      expect(props.reversePositiveNegativeColors).toBe(false);
      expect(props.reverseTrendDirection).toBe(false);
    });

    it('mirrors an existing TRUE colors config onto the new field when it was never configured', () => {
      const props = callProps({
        reversePositiveNegativeColors: true,
        reverseTrendDirection: undefined,
      });
      expect(props.reversePositiveNegativeColors).toBe(true);
      expect(props.reverseTrendDirection).toBe(true);
    });

    it('lets the new field be set independently once a user explicitly configures it', () => {
      const props = callProps({
        reversePositiveNegativeColors: true,
        reverseTrendDirection: false,
      });
      expect(props.reversePositiveNegativeColors).toBe(true);
      expect(props.reverseTrendDirection).toBe(false);
    });
  });
});
