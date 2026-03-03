import { useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { Theme } from '../../../theme/theme.types';
import styles from './MarkdownPro.module.css';
import { Markdown } from '@embeddable.com/remarkable-ui';
import { resolveI18nInMarkdown, resolveParagraphBreaksInMarkdown } from './MarkdownPro.utils';

type MarkdownProProps = {
  markdown?: string;
};

const MarkdownPro = (props: MarkdownProProps) => {
  const { markdown } = props;
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedMarkdown = useMemo(() => {
    const markdownString = resolveParagraphBreaksInMarkdown(markdown);
    return markdownString ? resolveI18nInMarkdown(markdownString) : markdownString;
  }, [markdown, theme]);

  return (
    <div className={styles.container}>
      <Markdown content={resolvedMarkdown} />
    </div>
  );
};

export default MarkdownPro;
