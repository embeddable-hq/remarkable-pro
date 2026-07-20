import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import GranularitySelectFieldPro from './index';

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

vi.mock('../shared/GranularitySelectField/GranularitySelectField', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GranularitySelectField: ({ onChange }: Record<string, any>) => (
    <button data-testid="field" onClick={() => onChange('month')}>
      field
    </button>
  ),
}));

describe('GranularitySelectFieldPro', () => {
  it('dispatches a user interaction event and forwards the granularity to onChange', () => {
    const onChange = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <GranularitySelectFieldPro
        onChange={onChange}
        componentName="GranularitySelectFieldPro"
        trackingId="track-3"
      />,
    );

    fireEvent.click(screen.getByTestId('field'));

    expect(onChange).toHaveBeenCalledWith('month');
    const event = dispatchSpy.mock.calls.at(-1)?.[0] as CustomEvent;
    expect(event.type).toBe('embeddable-user-interaction');
    expect(event.detail).toMatchObject({
      componentName: 'GranularitySelectFieldPro',
      trackingId: 'track-3',
      value: 'month',
    });
  });
});
