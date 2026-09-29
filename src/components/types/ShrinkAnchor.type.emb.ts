import { defineOption, defineType } from '@embeddable.com/core';

export const ShrinkAnchorTypeOptions = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
  none: 'none',
} as const;

type ShrinkAnchorValue = (typeof ShrinkAnchorTypeOptions)[keyof typeof ShrinkAnchorTypeOptions];

const shrinkAnchorLabelMap: Record<ShrinkAnchorValue, string> = {
  top: 'Top',
  middle: 'Middle',
  bottom: 'Bottom',
  none: 'None',
};

const ShrinkAnchorType = defineType('shrinkAnchor', {
  label: 'Shrink anchor',
  optionLabel: (value: ShrinkAnchorValue) => shrinkAnchorLabelMap[value],
});

Object.values(ShrinkAnchorTypeOptions).forEach((value) => defineOption(ShrinkAnchorType, value));

export default ShrinkAnchorType;
