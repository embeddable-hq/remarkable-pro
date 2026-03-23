import { applyRemarkableTheme } from './src/theme/fonts/fonts.utils';
import { Theme } from './src/theme/theme.types';

export default {
  onThemeUpdated: (theme: Theme) => applyRemarkableTheme(theme),
};
