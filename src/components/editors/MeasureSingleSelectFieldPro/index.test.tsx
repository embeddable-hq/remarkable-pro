import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MeasureSingleSelectFieldPro from './index';
import type { Measure } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
}));

vi.mock('../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock(
  '../shared/DimensionAndMeasureSingleSelectField/DimensionAndMeasureSingleSelectField',
  () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DimensionAndMeasureSingleSelectField: ({ onChange }: Record<string, any>) => (
      <button data-testid="field" onClick={() => onChange({ name: 'sales' })}>
        field
      </button>
    ),
  }),
);

const measureOption = { name: 'sales' } as unknown as Measure;

describe('MeasureSingleSelectFieldPro', () => {
  it('dispatches a user interaction event and forwards the selection to onChange', () => {
    const onChange = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <MeasureSingleSelectFieldPro
        measureOptions={[measureOption]}
        onChange={onChange}
        componentName="MeasureSingleSelectFieldPro"
        trackingId="track-2"
      />,
    );

    fireEvent.click(screen.getByTestId('field'));

    expect(onChange).toHaveBeenCalledWith({ name: 'sales' });
    const event = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
    expect(event.type).toBe('embeddable-user-interaction');
    expect(event.detail).toMatchObject({
      componentName: 'MeasureSingleSelectFieldPro',
      trackingId: 'track-2',
      value: { name: 'sales' },
    });
  });
});
