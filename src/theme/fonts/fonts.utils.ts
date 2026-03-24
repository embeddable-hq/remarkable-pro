import { injectCssVariables } from '../styles/styles.utils';
import { Theme } from '../theme.types';
import { ThemeFontCustom, ThemeGoogleFontFamily } from './fonts.types';

const REMARKABLE_FONTS_STYLE_ID = 'remarkable-theme-fonts';
const REMARKABLE_PRECONNECT_ATTR = 'data-remarkable-preconnect';
const REMARKABLE_GOOGLE_FONTS_ATTR = 'data-remarkable-google-fonts';

const injectGooglePreconnect = (head: HTMLHeadElement): void => {
  if (document.querySelector(`link[${REMARKABLE_PRECONNECT_ATTR}]`)) return;

  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  pre1.setAttribute(REMARKABLE_PRECONNECT_ATTR, '1');
  head.appendChild(pre1);

  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  pre2.setAttribute(REMARKABLE_PRECONNECT_ATTR, '1');
  head.appendChild(pre2);
};

const injectGoogleFonts = (families: ThemeGoogleFontFamily[], display = 'swap'): void => {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.querySelector(`link[${REMARKABLE_GOOGLE_FONTS_ATTR}]`)) return;

  const head = document.head;
  injectGooglePreconnect(head);

  const query = families
    .map((f) => {
      const encoded = encodeURIComponent(f.name.replace(/\s+/g, ' '));
      const weights = f.weights ?? '100..900';
      return `family=${encoded}:wght@${weights}`;
    })
    .join('&');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${query}&display=${display}`;
  link.setAttribute(REMARKABLE_GOOGLE_FONTS_ATTR, '1');
  head.appendChild(link);
};

const fontFaceCss = (font: ThemeFontCustom): string => {
  const family = font.family.replace(/'/g, "\\'");
  let src: string;

  if (typeof font.src === 'string') {
    src = `url(${font.src})`;
  } else {
    src = font.src
      .map((s) => (s.format ? `url(${s.url}) format('${s.format}')` : `url(${s.url})`))
      .join(', ');
  }

  const descriptorParts: string[] = [];
  if (font.descriptors) {
    const d = font.descriptors;
    if (d.style != null) descriptorParts.push(`font-style: ${d.style}`);
    if (d.weight != null) descriptorParts.push(`font-weight: ${d.weight}`);
    if (d.stretch != null) descriptorParts.push(`font-stretch: ${d.stretch}`);
    if (d.unicodeRange != null) descriptorParts.push(`unicode-range: ${d.unicodeRange}`);
  }

  const descriptors = descriptorParts.join('; ');
  const decl = descriptors ? `; ${descriptors}` : '';

  return `@font-face { font-family: '${family}'; src: ${src}${decl}; }`;
};

const injectCustomFonts = (custom: ThemeFontCustom[]): void => {
  if (typeof document === 'undefined' || !document.head || custom.length === 0) return;

  let styleEl = document.getElementById(REMARKABLE_FONTS_STYLE_ID) as HTMLStyleElement | null;
  const css = custom.map(fontFaceCss).join('\n');

  if (styleEl) {
    styleEl.textContent = css;
  } else {
    styleEl = document.createElement('style');
    styleEl.id = REMARKABLE_FONTS_STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }
};

export const loadThemeFonts = (theme: Theme): void => {
  const fonts = theme.fonts;
  if (!fonts) return;

  if (fonts.google?.families?.length) {
    injectGoogleFonts(fonts.google.families, fonts.google.display ?? 'swap');
  }
  if (fonts.custom?.length) {
    injectCustomFonts(fonts.custom);
  }
};

export const removeThemeFonts = (): void => {
  if (typeof document === 'undefined') return;

  document.querySelectorAll(`link[${REMARKABLE_PRECONNECT_ATTR}]`).forEach((el) => el.remove());
  document.querySelectorAll(`link[${REMARKABLE_GOOGLE_FONTS_ATTR}]`).forEach((el) => el.remove());
  document.getElementById(REMARKABLE_FONTS_STYLE_ID)?.remove();
};

/**
 * Applies Remarkable theme to the DOM: loads fonts and injects CSS variables.
 *
 * Fonts are loaded based on theme.fonts (Inter by default via remarkableTheme).
 * Font assignment (which font is used where) is controlled via theme.styles CSS variables.
 */
export const applyRemarkableTheme = (theme: Theme): (() => void) | void => {
  removeThemeFonts();
  loadThemeFonts(theme);
  return injectCssVariables(theme.styles);
};
