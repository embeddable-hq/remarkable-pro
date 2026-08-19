import { defineOption, defineType } from '@embeddable.com/core';

export const FunnelColorSchemeOptions = {
  amber: 'amber',
  orange: 'orange',
  blue: 'blue',
  greenRed: 'green-red',
  red: 'red',
} as const;

const colorSchemeLabelMap: Record<string, string> = {
  amber: 'Amber (low to high)',
  orange: 'Orange (low to high)',
  blue: 'Blue (low to high)',
  'green-red': 'Green to red (low to high)',
  red: 'Red (light to dark)',
};

const FunnelColorSchemeType = defineType('funnelColorScheme', {
  label: 'Color scheme',
  optionLabel: (value: string) => colorSchemeLabelMap[value] ?? value,
});

defineOption(FunnelColorSchemeType, FunnelColorSchemeOptions.amber);
defineOption(FunnelColorSchemeType, FunnelColorSchemeOptions.orange);
defineOption(FunnelColorSchemeType, FunnelColorSchemeOptions.blue);
defineOption(FunnelColorSchemeType, FunnelColorSchemeOptions.greenRed);
defineOption(FunnelColorSchemeType, FunnelColorSchemeOptions.red);

export default FunnelColorSchemeType;
