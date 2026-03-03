import { describe, it, expect, vi } from 'vitest';
import { resolveI18nInMarkdown, resolveParagraphBreaksInMarkdown } from './MarkdownPro.utils';

vi.mock('../../component.utils', () => ({
  resolveI18nString: (key: string) => `resolved:${key}`,
}));

describe('resolveParagraphBreaksInMarkdown', () => {
  it('returns undefined when input is undefined', () => {
    expect(resolveParagraphBreaksInMarkdown(undefined)).toBeUndefined();
  });

  it('replaces literal \\n with actual newline', () => {
    expect(resolveParagraphBreaksInMarkdown('line1\\nline2')).toBe('line1\nline2');
  });

  it('replaces multiple literal \\n occurrences', () => {
    expect(resolveParagraphBreaksInMarkdown('a\\nb\\nc')).toBe('a\nb\nc');
  });

  it('leaves real newlines unchanged', () => {
    expect(resolveParagraphBreaksInMarkdown('line1\nline2')).toBe('line1\nline2');
  });

  it('returns empty string unchanged', () => {
    expect(resolveParagraphBreaksInMarkdown('')).toBe('');
  });

  it('returns string with no \\n unchanged', () => {
    expect(resolveParagraphBreaksInMarkdown('hello world')).toBe('hello world');
  });
});

describe('resolveI18nInMarkdown', () => {
  it('replaces {{key}} placeholders with resolved i18n values', () => {
    expect(resolveI18nInMarkdown('Hello {{name}}')).toBe('Hello resolved:name');
  });

  it('replaces multiple placeholders', () => {
    expect(resolveI18nInMarkdown('{{greeting}} {{name}}')).toBe('resolved:greeting resolved:name');
  });

  it('leaves text without placeholders unchanged', () => {
    expect(resolveI18nInMarkdown('no placeholders here')).toBe('no placeholders here');
  });

  it('returns empty string unchanged', () => {
    expect(resolveI18nInMarkdown('')).toBe('');
  });

  it('does not match nested braces like {{{key}}}', () => {
    // outer braces remain, inner key is resolved
    expect(resolveI18nInMarkdown('{{{key}}}')).toBe('{resolved:key}');
  });

  it('does not match empty braces {{}}', () => {
    expect(resolveI18nInMarkdown('{{  }}')).toBe('resolved:  ');
  });
});
