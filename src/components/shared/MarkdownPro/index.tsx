import { useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { resolveI18nString } from '../../component.utils';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { Theme } from '../../../theme/theme.types';
import styles from './MarkdownPro.module.css';
import { Markdown } from '@embeddable.com/remarkable-ui';

type MarkdownProProps = {
  markdown?: string;
};

const resolveI18nInMarkdown = (markdown: string): string =>
  markdown.replaceAll(/\{\{([^{}]+)\}\}/g, (_, key) => resolveI18nString(key));

const MarkdownPro = (props: MarkdownProProps) => {
  const { markdown } = props;
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedMarkdown = useMemo(() => {
    const markdownString = markdown?.replaceAll(String.raw`\n`, '\n');
    return markdownString ? resolveI18nInMarkdown(markdownString) : markdownString;
  }, [markdown, theme]);

  return (
    <div className={styles.markdownContainer}>
      <Markdown content={resolvedMarkdown} />
    </div>
  );
};

export default MarkdownPro;
