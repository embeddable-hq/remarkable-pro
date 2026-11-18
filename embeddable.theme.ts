import { Theme } from './src/theme/theme.types';
import { remarkableTheme } from './src/theme/theme.constants';
import { getClientContextTimezone } from './src/theme/utils/clientContext.utils';

// Test-only theme for the EmKit fixes. Select it with client context { "theme": "emkit-test" }.
// German language and locale, plus a theme-level `scales` override on the area chart.
const emkitTestTheme: Theme = {
  ...remarkableTheme,
  i18n: { ...remarkableTheme.i18n, language: 'de' },
  formatter: { ...remarkableTheme.formatter, locale: 'de-DE' },
  charts: {
    ...remarkableTheme.charts,
    areaChartPro: { options: { scales: { x: { grid: { display: false } } } } },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const themeProvider = (clientContext: any): Theme => {
  const timezone = getClientContextTimezone(clientContext?.timezone);
  const base = clientContext?.theme === 'emkit-test' ? emkitTestTheme : remarkableTheme;

  return { ...base, clientContext: { ...clientContext, timezone } };
};

export default themeProvider;
