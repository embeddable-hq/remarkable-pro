import { loadThemeFonts } from './fonts.utils';

const getGoogleFontLinks = () => document.querySelectorAll('link[data-remarkable-google-fonts]');

const getPreconnectLinks = () => document.querySelectorAll('link[data-remarkable-preconnect]');

const getCustomFontStyle = () => document.getElementById('remarkable-theme-fonts');

const cleanup = () => {
  document.querySelectorAll('link[data-remarkable-preconnect]').forEach((el) => el.remove());
  document.querySelectorAll('link[data-remarkable-google-fonts]').forEach((el) => el.remove());
  document.getElementById('remarkable-theme-fonts')?.remove();
};

describe('loadThemeFonts', () => {
  afterEach(() => cleanup());

  it('is a no-op when fonts is undefined', () => {
    loadThemeFonts(undefined);
    expect(getGoogleFontLinks()).toHaveLength(0);
    expect(getCustomFontStyle()).toBeNull();
  });

  it('loads Google Fonts when google fonts are provided', () => {
    loadThemeFonts({ google: [{ name: 'Roboto' }, { name: 'Open Sans' }] });

    const links = getGoogleFontLinks();
    expect(links).toHaveLength(1);
    const href = (links[0] as HTMLLinkElement).href;
    expect(href).toContain('family=Roboto');
    expect(href).toContain('family=Open%20Sans');
    expect(href).toContain('display=swap');
  });

  it('respects custom weights per family', () => {
    loadThemeFonts({ google: [{ name: 'Roboto', weights: '400;700' }] });

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('wght@400;700');
  });

  it('defaults to full weight range when weights not specified', () => {
    loadThemeFonts({ google: [{ name: 'Lato' }] });

    const href = (getGoogleFontLinks()[0] as HTMLLinkElement).href;
    expect(href).toContain('wght@100..900');
  });

  it('injects preconnect links for Google Fonts', () => {
    loadThemeFonts({ google: [{ name: 'Roboto' }] });
    expect(getPreconnectLinks()).toHaveLength(2);
  });

  it('does not duplicate Google Font links on repeated calls', () => {
    loadThemeFonts({ google: [{ name: 'Roboto' }] });
    loadThemeFonts({ google: [{ name: 'Roboto' }] });
    expect(getGoogleFontLinks()).toHaveLength(1);
  });

  it('injects @font-face rules for custom fonts', () => {
    loadThemeFonts({
      custom: [{ family: 'BrandFont', src: 'https://example.com/brand.woff2' }],
    });

    const styleEl = getCustomFontStyle();
    expect(styleEl).not.toBeNull();
    expect(styleEl!.textContent).toContain("font-family: 'BrandFont'");
    expect(styleEl!.textContent).toContain('url(https://example.com/brand.woff2)');
  });

  it('includes font descriptors in @font-face rules', () => {
    loadThemeFonts({
      custom: [
        {
          family: 'MyFont',
          src: 'https://example.com/bold.woff2',
          descriptors: { weight: '700', style: 'italic' },
        },
      ],
    });

    const css = getCustomFontStyle()!.textContent!;
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('font-style: italic');
  });

  it('loads both Google and custom fonts together', () => {
    loadThemeFonts({
      google: [{ name: 'Roboto' }],
      custom: [{ family: 'BrandFont', src: 'https://example.com/brand.woff2' }],
    });

    expect(getGoogleFontLinks()).toHaveLength(1);
    expect(getCustomFontStyle()).not.toBeNull();
  });
});
