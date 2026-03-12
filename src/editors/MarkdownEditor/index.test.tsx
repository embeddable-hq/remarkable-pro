import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MarkdownInput from './index';

vi.mock('@embeddable.com/remarkable-ui', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('MarkdownInput', () => {
  it('renders the markdown editor', () => {
    render(<MarkdownInput value="hello" onChange={vi.fn()} />);
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
  });

  it('passes the value prop to the editor', () => {
    render(<MarkdownInput value="# Title" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('# Title')).toBeInTheDocument();
  });

  it('calls onChange when the editor value changes', () => {
    const onChange = vi.fn();
    render(<MarkdownInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('markdown-editor'), {
      target: { value: 'new content' },
    });
    expect(onChange).toHaveBeenCalledWith('new content');
  });

  it('updates the displayed value when the value prop changes', () => {
    const { rerender } = render(<MarkdownInput value="first" onChange={vi.fn()} />);
    rerender(<MarkdownInput value="second" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('second')).toBeInTheDocument();
  });

  it('calls onChange when value is undefined initially (ensures first keystroke is saved)', () => {
    const onChange = vi.fn();
    render(<MarkdownInput value={undefined} onChange={onChange} />);
    const editor = screen.getByTestId('markdown-editor');
    expect(editor).toHaveValue('');
    fireEvent.change(editor, { target: { value: 'first typed' } });
    expect(onChange).toHaveBeenCalledWith('first typed');
  });
});
