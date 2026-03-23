import { injectCssVariables } from '../styles/styles.utils';
import { Theme } from '../theme.types';
import { ThemeFontCustom } from './fonts.types';

const REMARKABLE_FONTS_STYLE_ID = 'remarkable-theme-fonts';
const REMARKABLE_INTER_LINK_SELECTOR = 'link[data-remarkable-inter]';
const DEFAULT_FONT_BASE = 'inter';
const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
]);

let pendingInterTimeout: ReturnType<typeof setTimeout> | null = null;

const injectGoogleFonts = (families: string[], display = 'swap'): void => {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.querySelector('link[data-remarkable-google-fonts]')) return;

  const head = document.head;

  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  head.appendChild(pre1);

  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  head.appendChild(pre2);

  const query = families
    .map((f) => `family=${encodeURIComponent(f.replace(/\s+/g, ' '))}:wght@100..900`)
    .join('&');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${query}&display=${display}`;
  link.setAttribute('data-remarkable-google-fonts', '1');
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
    styleEl.setAttribute('data-remarkable-custom-fonts', '1');
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

export const getFontFamilyStyles = (theme: Theme): Record<string, string> => {
  const fonts = theme.fonts;
  if (!fonts) return {};

  const base = fonts.familyBase ?? fonts.google?.families?.[0] ?? fonts.custom?.[0]?.family;
  const code = fonts.familyCode;
  const result: Record<string, string> = {};

  if (base) {
    result['--em-core-font-family--base'] = `'${base.replace(/'/g, "\\'")}'`;
  }
  if (code) {
    result['--em-core-font-family--code'] = `'${code.replace(/'/g, "\\'")}'`;
  }

  return result;
};

export const removeThemeFonts = (): void => {
  if (typeof document === 'undefined') return;

  if (pendingInterTimeout) {
    clearTimeout(pendingInterTimeout);
    pendingInterTimeout = null;
  }

  document.querySelectorAll('link[data-remarkable-google-fonts]').forEach((el) => el.remove());
  document.querySelectorAll(REMARKABLE_INTER_LINK_SELECTOR).forEach((el) => el.remove());
  document.getElementById(REMARKABLE_FONTS_STYLE_ID)?.remove();
};

export const injectInter = (): void => {
  if (typeof document === 'undefined') return;

  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) return;

  if (document.querySelector(REMARKABLE_INTER_LINK_SELECTOR)) return;

  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  head.appendChild(pre1);

  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  head.appendChild(pre2);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap';
  link.setAttribute('data-remarkable-inter', '1');
  head.appendChild(link);
};

const parseFontFamilyFromStyle = (value: unknown): string | null => {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();

  if (!trimmed || trimmed.toLowerCase() === DEFAULT_FONT_BASE) return null;
  if (GENERIC_FONT_FAMILIES.has(trimmed.toLowerCase())) return null;

  return trimmed;
};

export const themeHasFonts = (theme: Theme): boolean => {
  const f = theme.fonts;

  if ((f?.google?.families?.length ?? 0) > 0 || (f?.custom?.length ?? 0) > 0) return true;

  return (
    parseFontFamilyFromStyle(theme.styles?.['--em-core-font-family--base']) != null ||
    parseFontFamilyFromStyle(theme.styles?.['--em-core-font-family--code']) != null
  );
};

const loadFontFromStylesIfSet = (theme: Theme): boolean => {
  const families: string[] = [];

  for (const key of ['--em-core-font-family--base', '--em-core-font-family--code'] as const) {
    const f = parseFontFamilyFromStyle(theme.styles?.[key]);
    if (f && !families.includes(f)) families.push(f);
  }

  if (families.length === 0) return false;

  injectGoogleFonts(families);
  return true;
};

/**
 * Applies Remarkable theme to the DOM: loads fonts (or fallback Inter), injects CSS variables.
 *
 * Supports fonts via theme.fonts (if merged by defineTheme) or via theme.styles font tokens
 * (covers cases where `fonts` is omitted in transit). Inter is injected on a 0ms timeout so a
 * follow-up onThemeUpdated with full theme can cancel it.
 */
export const applyRemarkableTheme = (theme: Theme): (() => void) | void => {
  if (pendingInterTimeout) {
    clearTimeout(pendingInterTimeout);
    pendingInterTimeout = null;
  }

  removeThemeFonts();

  if (themeHasFonts(theme)) {
    loadThemeFonts(theme);

    const hasFontConfig =
      (theme.fonts?.google?.families?.length ?? 0) > 0 || (theme.fonts?.custom?.length ?? 0) > 0;

    if (!hasFontConfig) {
      loadFontFromStylesIfSet(theme);
    }

    const fontVars = getFontFamilyStyles(theme);
    const mergedStyles = { ...theme.styles, ...fontVars };
    return injectCssVariables(mergedStyles);
  }

  pendingInterTimeout = setTimeout(() => {
    pendingInterTimeout = null;
    injectInter();
  }, 0);

  return injectCssVariables(theme.styles);
};
