import { defineEditor } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';

import Component from './index';
import MarkdownType from './Markdown.type.emb';

export const meta = {
  name: 'MarkdownEditor',
  label: 'Markdown editor',
  type: MarkdownType,
};

/* @ts-expect-error - to be fixed in @embeddable.com/react */
export default defineEditor(Component, meta, {
  inputs: (value, setter) => {
    return {
      value,
      onChange: (val: string) => setter(Value.of(val)),
    };
  },
});
