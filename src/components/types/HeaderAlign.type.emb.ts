import { defineOption, defineType } from '@embeddable.com/core';

const HeaderAlignType = defineType('headerAlign', {
  label: 'Header alignment',
  optionLabel: (value: string) => value,
});

defineOption(HeaderAlignType, 'left');
defineOption(HeaderAlignType, 'center');
defineOption(HeaderAlignType, 'right');

export default HeaderAlignType;
