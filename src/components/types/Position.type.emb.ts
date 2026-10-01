import { defineOption, defineType } from '@embeddable.com/core';

export const PositionTypeOptions = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
  none: 'none',
} as const;

export type PositionValue = (typeof PositionTypeOptions)[keyof typeof PositionTypeOptions];

const positionLabelMap: Record<PositionValue, string> = {
  [PositionTypeOptions.top]: 'Top',
  [PositionTypeOptions.middle]: 'Middle',
  [PositionTypeOptions.bottom]: 'Bottom',
  [PositionTypeOptions.none]: 'None',
};

const PositionType = defineType('position', {
  label: 'Position',
  optionLabel: (value: PositionValue) => positionLabelMap[value],
});

defineOption(PositionType, PositionTypeOptions.top);
defineOption(PositionType, PositionTypeOptions.middle);
defineOption(PositionType, PositionTypeOptions.bottom);
defineOption(PositionType, PositionTypeOptions.none);

export default PositionType;
