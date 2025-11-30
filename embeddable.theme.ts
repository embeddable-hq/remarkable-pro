import { Theme } from './src/theme/theme.types';
import { remarkableTheme } from './src/theme/theme.constants';

const themeProvider = (): Theme => {
  return remarkableTheme;
};

export default themeProvider;
