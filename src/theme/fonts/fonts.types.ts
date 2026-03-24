export type ThemeGoogleFontFamily = {
  name: string;
  weights?: string;
};

export type ThemeFontGoogleConfig = {
  families: ThemeGoogleFontFamily[];
  display?: string;
};

export type ThemeFontCustomSrc = {
  url: string;
  format?: string;
};

export type ThemeFontCustomDescriptors = {
  style?: string;
  weight?: string;
  stretch?: string;
  unicodeRange?: string;
};

export type ThemeFontCustom = {
  family: string;
  src: string | ThemeFontCustomSrc[];
  descriptors?: ThemeFontCustomDescriptors;
};

export type ThemeFonts = {
  google?: ThemeFontGoogleConfig;
  custom?: ThemeFontCustom[];
};
