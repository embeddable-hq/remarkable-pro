import {
  applyRemarkableTheme,
  loadThemeFonts,
  getFontFamilyStyles,
  removeThemeFonts,
  injectInter,
  themeHasFonts,
} from './fonts.utils';
import type { Theme } from '../theme.types';

type ThemeOverrides = Omit<Partial<Theme>, 'styles'> & { styles?: Record<string, string> };

const makeTheme = (overrides: ThemeOverrides = {}): Theme =>
  ({ styles: {}, ...overrides }) as unknown as Theme;

const getGoogleFontLinks = () => document.querySelectorAll('link[data-remarkable-google-fonts]');

const getInterLinks = () => document.querySelectorAll('link[data-remarkable-inter]');

const getCustomFontStyle = () => document.getElementById('remarkable-theme-fonts');

describe('loadThemeFonts', () => {
  afterEach(() => removeThemeFonts());

  it('is a no-op when theme.fonts is undefined', () => {
    loadThemeFonts(makeTheme());
    expect(getGoogleFontLinks()).toHaveLength(0);
    expect(getCustomFontStyle()).toBeNull();
  });

  it('loads Google Fonts when google.families is provided', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: ['Roboto', 'Open Sans'] } } }));

    const links = getGoogleFontLinks();
    expect(links).toHaveLength(1);
    const href = (links[0] as HTMLLinkElement).href;
    expect(href).toContain('family=Roboto');
    expect(href).toContain('family=Open%20Sans');
    expect(href).toContain('display=swap');
  });

  it('respects custom display parameter for Google Fonts', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: ['Lato'], display: 'block' } } }));

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('display=block');
  });

  it('injects @font-face rules for custom fonts', () => {
    loadThemeFonts(
      makeTheme({
        fonts: {
          custom: [{ family: 'BrandFont', src: 'https://example.com/brand.woff2' }],
        },
      }),
    );

    const styleEl = getCustomFontStyle();
    expect(styleEl).not.toBeNull();
    expect(styleEl!.textContent).toContain("font-family: 'BrandFont'");
    expect(styleEl!.textContent).toContain('url(https://example.com/brand.woff2)');
  });

  it('supports multiple custom font sources with format', () => {
    loadThemeFonts(
      makeTheme({
        fonts: {
          custom: [
            {
              family: 'MyFont',
              src: [
                { url: 'https://example.com/font.woff2', format: 'woff2' },
                { url: 'https://example.com/font.woff', format: 'woff' },
              ],
            },
          ],
        },
      }),
    );

    const css = getCustomFontStyle()!.textContent!;
    expect(css).toContain("format('woff2')");
    expect(css).toContain("format('woff')");
  });

  it('includes font descriptors in @font-face rules', () => {
    loadThemeFonts(
      makeTheme({
        fonts: {
          custom: [
            {
              family: 'MyFont',
              src: 'https://example.com/bold.woff2',
              descriptors: { weight: '700', style: 'italic' },
            },
          ],
        },
      }),
    );

    const css = getCustomFontStyle()!.textContent!;
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('font-style: italic');
  });
});

describe('getFontFamilyStyles', () => {
  it('returns empty object when no fonts config', () => {
    expect(getFontFamilyStyles(makeTheme())).toEqual({});
  });

  it('uses familyBase for --em-core-font-family--base', () => {
    const result = getFontFamilyStyles(makeTheme({ fonts: { familyBase: 'Roboto' } }));
    expect(result['--em-core-font-family--base']).toBe("'Roboto'");
  });

  it('uses familyCode for --em-core-font-family--code', () => {
    const result = getFontFamilyStyles(makeTheme({ fonts: { familyCode: 'Fira Code' } }));
    expect(result['--em-core-font-family--code']).toBe("'Fira Code'");
  });

  it('falls back to first Google family when familyBase is not set', () => {
    const result = getFontFamilyStyles(
      makeTheme({ fonts: { google: { families: ['Lato', 'Open Sans'] } } }),
    );
    expect(result['--em-core-font-family--base']).toBe("'Lato'");
  });

  it('falls back to first custom font family when no Google families', () => {
    const result = getFontFamilyStyles(
      makeTheme({
        fonts: { custom: [{ family: 'BrandFont', src: 'https://example.com/f.woff2' }] },
      }),
    );
    expect(result['--em-core-font-family--base']).toBe("'BrandFont'");
  });

  it('familyBase takes precedence over google/custom families', () => {
    const result = getFontFamilyStyles(
      makeTheme({
        fonts: {
          google: { families: ['Roboto'] },
          familyBase: 'CustomName',
        },
      }),
    );
    expect(result['--em-core-font-family--base']).toBe("'CustomName'");
  });
});

describe('themeHasFonts', () => {
  it('returns false when no fonts and default styles', () => {
    expect(themeHasFonts(makeTheme())).toBe(false);
  });

  it('returns true when Google families are set', () => {
    expect(themeHasFonts(makeTheme({ fonts: { google: { families: ['Roboto'] } } }))).toBe(true);
  });

  it('returns true when custom fonts are set', () => {
    expect(
      themeHasFonts(
        makeTheme({
          fonts: { custom: [{ family: 'X', src: 'https://example.com/x.woff2' }] },
        }),
      ),
    ).toBe(true);
  });

  it('returns true when styles override --em-core-font-family--base with non-default', () => {
    expect(
      themeHasFonts(
        makeTheme({
          styles: { '--em-core-font-family--base': "'Roboto'" },
        }),
      ),
    ).toBe(true);
  });

  it('returns false when styles set --em-core-font-family--base to inter', () => {
    expect(
      themeHasFonts(
        makeTheme({
          styles: { '--em-core-font-family--base': 'inter' },
        }),
      ),
    ).toBe(false);
  });

  it('returns false for generic font families in styles', () => {
    expect(
      themeHasFonts(
        makeTheme({
          styles: { '--em-core-font-family--base': 'sans-serif' },
        }),
      ),
    ).toBe(false);
  });
});

describe('injectInter', () => {
  afterEach(() => removeThemeFonts());

  it('injects Inter stylesheet with preconnect links', () => {
    injectInter();

    const links = getInterLinks();
    expect(links).toHaveLength(1);
    expect((links[0] as HTMLLinkElement).href).toContain('family=Inter');
  });

  it('does not duplicate Inter links on repeated calls', () => {
    injectInter();
    injectInter();

    expect(getInterLinks()).toHaveLength(1);
  });
});

describe('removeThemeFonts', () => {
  it('removes preconnect links', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: ['Roboto'] } } }));
    expect(document.querySelectorAll('link[data-remarkable-preconnect]')).toHaveLength(2);

    removeThemeFonts();
    expect(document.querySelectorAll('link[data-remarkable-preconnect]')).toHaveLength(0);
  });

  it('removes Google Font links', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: ['Roboto'] } } }));
    expect(getGoogleFontLinks()).toHaveLength(1);

    removeThemeFonts();
    expect(getGoogleFontLinks()).toHaveLength(0);
  });

  it('removes custom font style element', () => {
    loadThemeFonts(
      makeTheme({
        fonts: { custom: [{ family: 'X', src: 'https://example.com/x.woff2' }] },
      }),
    );
    expect(getCustomFontStyle()).not.toBeNull();

    removeThemeFonts();
    expect(getCustomFontStyle()).toBeNull();
  });

  it('removes Inter links', () => {
    injectInter();
    expect(getInterLinks()).toHaveLength(1);

    removeThemeFonts();
    expect(getInterLinks()).toHaveLength(0);
  });
});

describe('applyRemarkableTheme', () => {
  afterEach(() => removeThemeFonts());

  it('loads custom fonts and injects CSS variables with font overrides', () => {
    const cleanup = applyRemarkableTheme(
      makeTheme({
        fonts: {
          google: { families: ['Roboto'] },
          familyBase: 'Roboto',
        },
        styles: { '--em-sem-text': '#000' },
      }),
    );

    expect(getGoogleFontLinks()).toHaveLength(1);

    const styleEl = document.getElementById('remarkable-ui-embeddable-style');
    expect(styleEl?.textContent).toContain("--em-core-font-family--base: 'Roboto'");
    expect(styleEl?.textContent).toContain('--em-sem-text: #000');

    if (typeof cleanup === 'function') cleanup();
  });

  it('defers Inter loading when no custom fonts are configured', () => {
    vi.useFakeTimers();

    applyRemarkableTheme(makeTheme());

    expect(getInterLinks()).toHaveLength(0);

    vi.runAllTimers();
    expect(getInterLinks()).toHaveLength(1);

    vi.useRealTimers();
  });

  it('cancels deferred Inter when a themed font arrives', () => {
    vi.useFakeTimers();

    applyRemarkableTheme(makeTheme());

    applyRemarkableTheme(makeTheme({ fonts: { google: { families: ['Roboto'] } } }));

    vi.runAllTimers();
    expect(getInterLinks()).toHaveLength(0);
    expect(getGoogleFontLinks()).toHaveLength(1);

    vi.useRealTimers();
  });
});
