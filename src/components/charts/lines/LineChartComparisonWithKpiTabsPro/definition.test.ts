import { describe, it, expect, vi } from 'vitest';

// Mock UI deps so importing the definition doesn't load real CSS-bundled packages.
vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
  definePreview: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
}));

vi.mock('../../../component.utils', async () => {
  const actual = await vi.importActual<typeof import('../../../component.utils')>(
    '../../../component.utils',
  );
  return {
    ...actual,
    resolveI18nProps: vi.fn((props) => props),
  };
});

vi.mock('../../shared/ChartCard/ChartCard', () => ({
  ChartCard: () => null,
  asChartCardHeaderProps: (props: Record<string, unknown>) => props,
}));

vi.mock('../../charts.fillGaps.hooks', () => ({
  useFillGaps: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  ChartTabs: () => null,
  KpiTrend: () => null,
  LineChart: () => null,
}));

vi.mock('../../shared/ChartGranularitySelectField/ChartGranularitySelectField', () => ({
  ChartGranularitySelectField: () => null,
}));

vi.mock('../LineChartComparisonDefaultPro/LineChartComparisonDefaultPro.utils', () => ({
  getLineChartComparisonProData: vi.fn(() => ({ datasets: [], labels: [] })),
  getLineChartComparisonProOptions: vi.fn(() => ({})),
  createComparisonClickHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(),
}));

vi.mock('../../../utils/timeRange.utils', () => ({
  getComparisonPeriodDateRange: vi.fn(() => ({
    relativeTimeString: 'Previous period',
    from: undefined,
    to: undefined,
  })),
}));

const { lineChartComparisonWithKpiTabsPro } = await import('./definition');

describe('LineChartComparisonWithKpiTabsPro definition', () => {
  it('exposes "Reverse trend direction" as its own measures sub-input, separate from the colors toggle', () => {
    const measuresInput = lineChartComparisonWithKpiTabsPro.meta.inputs.find(
      (input) => input.name === 'measures',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subInputs: any[] = measuresInput.inputs;
    const reverseTrendDirectionInput = subInputs.find(
      (input) => input.name === 'reverseTrendDirection',
    );
    const invertChangeColorsInput = subInputs.find((input) => input.name === 'invertChangeColors');

    expect(reverseTrendDirectionInput).toBeDefined();
    expect(reverseTrendDirectionInput?.label).toBe('Reverse trend direction');
    expect(invertChangeColorsInput?.label).toBe('Reverse positive/negative colors');

    // No static defaultValue, so it can fall back to the legacy colors value.
    expect(reverseTrendDirectionInput).not.toHaveProperty('defaultValue');
  });
});
