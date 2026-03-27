export type ThemeFontGoogle = {
  name: string;
  weights?: string;
};

export type ThemeFontCustomDescriptors = {
  style?: string;
  weight?: string;
  stretch?: string;
  unicodeRange?: string;
};

export type ThemeFontCustom = {
  family: string;
  src: string;
  descriptors?: ThemeFontCustomDescriptors;
};

export type ThemeFonts = {
  google?: ThemeFontGoogle[];
  custom?: ThemeFontCustom[];
};
