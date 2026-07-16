import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DimensionSingleSelectFieldPro from './index';
import type { Dimension } from '@embeddable.com/core';

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
      <button data-testid="field" onClick={() => onChange({ name: 'revenue' })}>
        field
      </button>
    ),
  }),
);

const dimensionOption = { name: 'revenue' } as unknown as Dimension;

describe('DimensionSingleSelectFieldPro', () => {
  it('dispatches a user interaction event and forwards the selection to onChange', () => {
    const onChange = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <DimensionSingleSelectFieldPro
        dimensionOptions={[dimensionOption]}
        onChange={onChange}
        componentName="DimensionSingleSelectFieldPro"
        trackingId="track-1"
      />,
    );

    fireEvent.click(screen.getByTestId('field'));

    expect(onChange).toHaveBeenCalledWith({ name: 'revenue' });
    const event = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
    expect(event.type).toBe('embeddable-user-interaction');
    expect(event.detail).toMatchObject({
      componentName: 'DimensionSingleSelectFieldPro',
      trackingId: 'track-1',
      value: { name: 'revenue' },
    });
  });
});
