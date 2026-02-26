import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GranularitySelectField } from './GranularitySelectField';
import {
  getGranularitySelectFieldOptions,
  getAvailableGranularityOptionsFromTimeRange,
  getSafeSelection,
} from './GranularitySelectField.utils';
import type { Granularity } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn().mockReturnValue({}) }));
vi.mock('../../../../theme/i18n/i18n', () => ({ i18nSetup: vi.fn() }));
vi.mock('./GranularitySelectField.utils', () => ({
  getGranularitySelectFieldOptions: vi.fn(),
  getAvailableGranularityOptionsFromTimeRange: vi.fn(),
  getSafeSelection: vi.fn(),
}));
vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: ({
    value,
    options,
    onChange,
    variant,
    clearable,
    placeholder,
    side,
    align,
  }: {
    value: string;
    options: unknown[];
    onChange: (v: string) => void;
    variant?: string;
    clearable?: boolean;
    placeholder?: string;
    side?: string;
    align?: string;
  }) => (
    <div
      data-testid="single-select-field"
      data-value={value}
      data-option-count={options.length}
      data-variant={variant}
      data-clearable={String(clearable)}
      data-placeholder={placeholder}
      data-side={side}
      data-align={align}
    >
      <button data-testid="trigger-change" onClick={() => onChange('week')}>
        change
      </button>
    </div>
  ),
}));

const makeOpt = (value: string) => ({ value, label: value });

const ALL_OPTS = ['day', 'week', 'month'].map(makeOpt);

// ---------------------------------------------------------------------------

describe('GranularitySelectField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGranularitySelectFieldOptions).mockReturnValue(ALL_OPTS);
    vi.mocked(getAvailableGranularityOptionsFromTimeRange).mockReturnValue(ALL_OPTS);
    vi.mocked(getSafeSelection).mockImplementation((_, g) => g as Granularity);
  });

  it('renders the SingleSelectField', () => {
    render(
      <GranularitySelectField
        onChange={vi.fn()}
        granularities={['day', 'week', 'month']}
        granularity="day"
      />,
    );
    expect(screen.getByTestId('single-select-field')).toBeInTheDocument();
  });

  it('passes safeValue to SingleSelectField', () => {
    vi.mocked(getSafeSelection).mockReturnValue('week' as Granularity);
    render(
      <GranularitySelectField
        onChange={vi.fn()}
        granularities={['day', 'week', 'month']}
        granularity="week"
      />,
    );
    expect(screen.getByTestId('single-select-field')).toHaveAttribute('data-value', 'week');
  });

  it('passes available options to SingleSelectField', () => {
    const opts = [makeOpt('day'), makeOpt('week')];
    vi.mocked(getAvailableGranularityOptionsFromTimeRange).mockReturnValue(opts);
    render(
      <GranularitySelectField
        onChange={vi.fn()}
        granularities={['day', 'week']}
        granularity="day"
      />,
    );
    expect(screen.getByTestId('single-select-field')).toHaveAttribute('data-option-count', '2');
  });

  it('passes variant, clearable, placeholder, side, and align to SingleSelectField', () => {
    render(
      <GranularitySelectField
        onChange={vi.fn()}
        granularities={['day']}
        granularity="day"
        variant="ghost"
        clearable={true}
        placeholder="Pick one"
        side="top"
        align="end"
      />,
    );
    const field = screen.getByTestId('single-select-field');
    expect(field).toHaveAttribute('data-variant', 'ghost');
    expect(field).toHaveAttribute('data-clearable', 'true');
    expect(field).toHaveAttribute('data-placeholder', 'Pick one');
    expect(field).toHaveAttribute('data-side', 'top');
    expect(field).toHaveAttribute('data-align', 'end');
  });

  it('calls onChange when SingleSelectField fires a change', () => {
    const onChange = vi.fn();
    render(
      <GranularitySelectField
        onChange={onChange}
        granularities={['day', 'week', 'month']}
        granularity="day"
      />,
    );
    screen.getByTestId('trigger-change').click();
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('calls onChange via useEffect when granularity is not in available options', () => {
    vi.mocked(getAvailableGranularityOptionsFromTimeRange).mockReturnValue([makeOpt('week')]);
    vi.mocked(getSafeSelection).mockReturnValue('week' as Granularity);
    const onChange = vi.fn();
    render(
      <GranularitySelectField onChange={onChange} granularities={['week']} granularity="day" />,
    );
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('does not call onChange via useEffect when granularity is already available', () => {
    vi.mocked(getAvailableGranularityOptionsFromTimeRange).mockReturnValue([
      makeOpt('day'),
      makeOpt('week'),
    ]);
    const onChange = vi.fn();
    render(
      <GranularitySelectField
        onChange={onChange}
        granularities={['day', 'week']}
        granularity="day"
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange via useEffect when granularity is undefined', () => {
    const onChange = vi.fn();
    render(<GranularitySelectField onChange={onChange} granularities={['day', 'week']} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('filters all options by granularities prop before passing to getAvailableGranularityOptionsFromTimeRange', () => {
    vi.mocked(getGranularitySelectFieldOptions).mockReturnValue([
      makeOpt('day'),
      makeOpt('week'),
      makeOpt('month'),
    ]);
    render(
      <GranularitySelectField onChange={vi.fn()} granularities={['week']} granularity="week" />,
    );
    const [, filtered] = vi.mocked(getAvailableGranularityOptionsFromTimeRange).mock.calls[0]!;
    expect(filtered).toEqual([makeOpt('week')]);
  });

  it('passes primaryTimeRange to getAvailableGranularityOptionsFromTimeRange', () => {
    const timeRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-07'),
      relativeTimeString: '',
    };
    render(
      <GranularitySelectField
        onChange={vi.fn()}
        granularities={['day', 'week']}
        granularity="day"
        primaryTimeRange={timeRange}
      />,
    );
    const [passedRange] = vi.mocked(getAvailableGranularityOptionsFromTimeRange).mock.calls[0]!;
    expect(passedRange).toBe(timeRange);
  });
});
