import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import HorizontalDividerPro from './index';
import { inputs } from '../../component.inputs.constants';
import { getStyle } from '@embeddable.com/remarkable-ui';

export const meta = {
  name: 'HorizontalDividerPro',
  label: 'Horizontal Divider',
  category: 'Layout',
  defaultWidth: 450,
  defaultHeight: 120,
  inputs: [
    {
      ...inputs.number,
      name: 'thickness',
      label: 'Thickness',
      category: 'Component Settings',
      description: 'Thickness of the divider in pixels',
    },
    { ...inputs.color, defaultValue: getStyle('--em-divider-color', '#e4e4ea') },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(HorizontalDividerPro, {});
export default defineComponent(HorizontalDividerPro, meta, {
  /* @ts-expect-error - to be fixed in @embeddable.com/react */
  props: (inputs: Inputs<typeof meta>) => {
    return { ...inputs };
  },
});
