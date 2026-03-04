import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TextFieldPro from './index';

const mockOnChange = vi.fn();

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  TextField: ({
    value,
    placeholder,
    onChange,
    clearable,
  }: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    clearable?: boolean;
  }) => (
    <div data-testid="text-field" data-clearable={String(clearable)} data-placeholder={placeholder}>
      <input
        data-testid="text-field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="input"
      />
      {value ? (
        <button data-testid="text-field-clear" type="button" onClick={() => onChange('')}>
          Clear
        </button>
      ) : null}
    </div>
  ),
  useDebounce: (fn: (v: string) => void) => fn,
}));

vi.mock('../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="editor-card">{children}</div>
  ),
}));

describe('TextFieldPro', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders EditorCard and TextField', () => {
    render(<TextFieldPro onChange={mockOnChange} />);
    expect(screen.getByTestId('editor-card')).toBeInTheDocument();
    expect(screen.getByTestId('text-field')).toBeInTheDocument();
  });

  it('passes placeholder to TextField, defaulting to empty string', () => {
    render(<TextFieldPro onChange={mockOnChange} />);
    expect(screen.getByTestId('text-field')).toHaveAttribute('data-placeholder', '');
  });

  it('passes configured placeholder to TextField', () => {
    render(<TextFieldPro placeholder="Search..." onChange={mockOnChange} />);
    expect(screen.getByTestId('text-field')).toHaveAttribute('data-placeholder', 'Search...');
  });

  it('passes clearable to TextField', () => {
    render(<TextFieldPro onChange={mockOnChange} />);
    expect(screen.getByTestId('text-field')).toHaveAttribute('data-clearable', 'true');
  });

  it('calls onChange with empty string when user clears the input', () => {
    render(<TextFieldPro value="hello" onChange={mockOnChange} />);
    const clearButton = screen.getByTestId('text-field-clear');
    fireEvent.click(clearButton);
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('shows initial value from variable', () => {
    render(<TextFieldPro value="initial" onChange={mockOnChange} />);
    const input = screen.getByTestId('text-field-input');
    expect(input).toHaveValue('initial');
  });
});
