import { loadThemeFonts } from './src/theme/fonts/fonts.utils';
import { injectCssVariables } from './src/theme/styles/styles.utils';
import { Theme } from './src/theme/theme.types';

export default {
  onThemeUpdated: (theme: Theme) => {
    loadThemeFonts(theme.fonts);
    return injectCssVariables(theme.styles);
  },
};
