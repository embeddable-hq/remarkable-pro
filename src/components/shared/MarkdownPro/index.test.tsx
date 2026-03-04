import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MarkdownPro from './index';
import { resolveParagraphBreaksInMarkdown, resolveI18nInMarkdown } from './MarkdownPro.utils';
import { i18nSetup } from '../../../theme/i18n/i18n';

const mockTheme = { colors: { primary: '#000' } };

vi.mock('@embeddable.com/react', () => ({
  useTheme: () => mockTheme,
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  Markdown: ({ content }: { content?: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

vi.mock('./MarkdownPro.module.css', () => ({
  default: { container: 'container' },
}));

vi.mock('./MarkdownPro.utils', () => ({
  resolveParagraphBreaksInMarkdown: vi.fn((md?: string) => md),
  resolveI18nInMarkdown: vi.fn((md: string) => `i18n:${md}`),
}));

describe('MarkdownPro', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(resolveParagraphBreaksInMarkdown).mockImplementation((md?: string) => md);
    vi.mocked(resolveI18nInMarkdown).mockImplementation((md: string) => `i18n:${md}`);
  });

  it('calls i18nSetup with the theme', () => {
    render(<MarkdownPro />);
    expect(vi.mocked(i18nSetup)).toHaveBeenCalledWith(mockTheme);
  });

  it('calls resolveParagraphBreaksInMarkdown with the markdown prop', () => {
    render(<MarkdownPro markdown={String.raw`line1\nline2`} />);
    expect(vi.mocked(resolveParagraphBreaksInMarkdown)).toHaveBeenCalledWith(
      String.raw`line1\nline2`,
    );
  });

  it('calls resolveI18nInMarkdown with the paragraph-resolved result', () => {
    vi.mocked(resolveParagraphBreaksInMarkdown).mockReturnValue('line1\nline2');
    render(<MarkdownPro markdown={String.raw`line1\nline2`} />);
    expect(vi.mocked(resolveI18nInMarkdown)).toHaveBeenCalledWith('line1\nline2');
  });

  it('passes the fully resolved markdown to Markdown', () => {
    vi.mocked(resolveParagraphBreaksInMarkdown).mockReturnValue('resolved');
    vi.mocked(resolveI18nInMarkdown).mockReturnValue('i18n:resolved');
    render(<MarkdownPro markdown="original" />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('i18n:resolved');
  });

  it('does not call resolveI18nInMarkdown when markdown is undefined', () => {
    render(<MarkdownPro />);
    expect(vi.mocked(resolveI18nInMarkdown)).not.toHaveBeenCalled();
  });

  it('does not call resolveI18nInMarkdown when markdown is empty string', () => {
    render(<MarkdownPro markdown="" />);
    expect(vi.mocked(resolveI18nInMarkdown)).not.toHaveBeenCalled();
  });

  it('renders the container div', () => {
    const { container } = render(<MarkdownPro />);
    expect(container.firstChild).toHaveClass('container');
  });
});
