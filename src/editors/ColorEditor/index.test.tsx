import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ColorInput from './index';

vi.mock('@embeddable.com/remarkable-ui', () => ({
  GhostButtonIcon: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="clear-button" />
  ),
}));

vi.mock('@tabler/icons-react', () => ({ IconX: {} }));

describe('ColorInput', () => {
  it('renders a color input with the given value', () => {
    render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
  });

  it('shows the clear button when a color value is provided', () => {
    render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });

  it('hides the clear button when value is empty', () => {
    render(<ColorInput value="" onChange={vi.fn()} />);
    expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
  });

  it('calls onChange with the new color when input changes', () => {
    const onChange = vi.fn();
    render(<ColorInput value="#ff0000" onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue('#ff0000'), { target: { value: '#00ff00' } });
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  it('calls onChange with undefined when clear button is clicked', () => {
    const onChange = vi.fn();
    render(<ColorInput value="#ff0000" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('clear-button'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('updates the displayed color when the value prop changes', () => {
    const { rerender } = render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    rerender(<ColorInput value="#0000ff" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('#0000ff')).toBeInTheDocument();
  });

  it('renders a color input element', () => {
    const { container } = render(<ColorInput value="#123456" onChange={vi.fn()} />);
    const input = container.querySelector('input[type="color"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('#123456');
  });
});
