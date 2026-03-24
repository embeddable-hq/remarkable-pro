import { applyRemarkableTheme, loadThemeFonts, removeThemeFonts } from './fonts.utils';
import type { Theme } from '../theme.types';

type ThemeOverrides = Omit<Partial<Theme>, 'styles'> & { styles?: Record<string, string> };

const makeTheme = (overrides: ThemeOverrides = {}): Theme =>
  ({ styles: {}, ...overrides }) as unknown as Theme;

const getGoogleFontLinks = () => document.querySelectorAll('link[data-remarkable-google-fonts]');

const getPreconnectLinks = () => document.querySelectorAll('link[data-remarkable-preconnect]');

const getCustomFontStyle = () => document.getElementById('remarkable-theme-fonts');

describe('loadThemeFonts', () => {
  afterEach(() => removeThemeFonts());

  it('is a no-op when theme.fonts is undefined', () => {
    loadThemeFonts(makeTheme());
    expect(getGoogleFontLinks()).toHaveLength(0);
    expect(getCustomFontStyle()).toBeNull();
  });

  it('loads Google Fonts when google.families is provided', () => {
    loadThemeFonts(
      makeTheme({
        fonts: { google: { families: [{ name: 'Roboto' }, { name: 'Open Sans' }] } },
      }),
    );

    const links = getGoogleFontLinks();
    expect(links).toHaveLength(1);
    const href = (links[0] as HTMLLinkElement).href;
    expect(href).toContain('family=Roboto');
    expect(href).toContain('family=Open%20Sans');
    expect(href).toContain('display=swap');
  });

  it('respects custom weights per family', () => {
    loadThemeFonts(
      makeTheme({
        fonts: { google: { families: [{ name: 'Roboto', weights: '400;700' }] } },
      }),
    );

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('wght@400;700');
  });

  it('defaults to full weight range when weights not specified', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: [{ name: 'Lato' }] } } }));

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('wght@100..900');
  });

  it('respects custom display parameter for Google Fonts', () => {
    loadThemeFonts(
      makeTheme({ fonts: { google: { families: [{ name: 'Lato' }], display: 'block' } } }),
    );

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

  it('loads both Google and custom fonts together', () => {
    loadThemeFonts(
      makeTheme({
        fonts: {
          google: { families: [{ name: 'Roboto' }] },
          custom: [{ family: 'BrandFont', src: 'https://example.com/brand.woff2' }],
        },
      }),
    );

    expect(getGoogleFontLinks()).toHaveLength(1);
    expect(getCustomFontStyle()).not.toBeNull();
  });
});

describe('removeThemeFonts', () => {
  it('removes preconnect links', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: [{ name: 'Roboto' }] } } }));
    expect(getPreconnectLinks()).toHaveLength(2);

    removeThemeFonts();
    expect(getPreconnectLinks()).toHaveLength(0);
  });

  it('removes Google Font links', () => {
    loadThemeFonts(makeTheme({ fonts: { google: { families: [{ name: 'Roboto' }] } } }));
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
});

describe('applyRemarkableTheme', () => {
  afterEach(() => removeThemeFonts());

  it('loads fonts and injects CSS variables', () => {
    const cleanup = applyRemarkableTheme(
      makeTheme({
        fonts: { google: { families: [{ name: 'Roboto' }] } },
        styles: { '--em-core-font-family--base': "'Roboto'", '--em-sem-text': '#000' },
      }),
    );

    expect(getGoogleFontLinks()).toHaveLength(1);

    const styleEl = document.getElementById('remarkable-ui-embeddable-style');
    expect(styleEl?.textContent).toContain("--em-core-font-family--base: 'Roboto'");
    expect(styleEl?.textContent).toContain('--em-sem-text: #000');

    if (typeof cleanup === 'function') cleanup();
  });

  it('cleans up previous fonts before loading new ones', () => {
    applyRemarkableTheme(makeTheme({ fonts: { google: { families: [{ name: 'Roboto' }] } } }));
    expect(getGoogleFontLinks()).toHaveLength(1);

    applyRemarkableTheme(makeTheme({ fonts: { google: { families: [{ name: 'Open Sans' }] } } }));

    expect(getGoogleFontLinks()).toHaveLength(1);
    expect((getGoogleFontLinks()[0] as HTMLLinkElement).href).toContain('family=Open%20Sans');
  });

  it('loads Inter by default when using remarkableTheme fonts', () => {
    applyRemarkableTheme(
      makeTheme({
        fonts: { google: { families: [{ name: 'Inter', weights: '100..900' }] } },
      }),
    );

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('family=Inter');
    expect(href).toContain('wght@100..900');
  });

  it('injects only styles when no fonts are configured', () => {
    applyRemarkableTheme(makeTheme({ styles: { '--em-sem-text': 'red' } }));

    expect(getGoogleFontLinks()).toHaveLength(0);
    const styleEl = document.getElementById('remarkable-ui-embeddable-style');
    expect(styleEl?.textContent).toContain('--em-sem-text: red');
  });
});
