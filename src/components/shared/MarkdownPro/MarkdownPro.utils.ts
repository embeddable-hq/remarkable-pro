import { resolveI18nString } from '../../component.utils';

export const resolveI18nInMarkdown = (markdown: string): string =>
  markdown.replaceAll(/\{\{([^{}]+)\}\}/g, (_, key) => resolveI18nString(key));

export const resolveParagraphBreaksInMarkdown = (markdown?: string): string | undefined =>
  markdown?.replaceAll(String.raw`\n`, '\n');
