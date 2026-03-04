import { defineType } from '@embeddable.com/core';

const MarkdownType = defineType('markdown', {
  label: 'Markdown',
  optionLabel: (value: string) => value.toUpperCase(),
});

export default MarkdownType;
