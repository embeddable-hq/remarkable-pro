import { defineOption, defineType } from '@embeddable.com/core';

export const ShrinkAnchorTypeOptions = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
  none: 'none',
} as const;

type ShrinkAnchorValue = (typeof ShrinkAnchorTypeOptions)[keyof typeof ShrinkAnchorTypeOptions];

const shrinkAnchorLabelMap: Record<ShrinkAnchorValue, string> = {
  [ShrinkAnchorTypeOptions.top]: 'Top',
  [ShrinkAnchorTypeOptions.middle]: 'Middle',
  [ShrinkAnchorTypeOptions.bottom]: 'Bottom',
  [ShrinkAnchorTypeOptions.none]: 'None',
};

const ShrinkAnchorType = defineType('shrinkAnchor', {
  label: 'Shrink anchor',
  optionLabel: (value: ShrinkAnchorValue) => shrinkAnchorLabelMap[value],
});

defineOption(ShrinkAnchorType, ShrinkAnchorTypeOptions.top);
defineOption(ShrinkAnchorType, ShrinkAnchorTypeOptions.middle);
defineOption(ShrinkAnchorType, ShrinkAnchorTypeOptions.bottom);
defineOption(ShrinkAnchorType, ShrinkAnchorTypeOptions.none);

export default ShrinkAnchorType;
