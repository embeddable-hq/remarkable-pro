import { Theme } from './src/theme/theme.types';
import { remarkableTheme } from './src/theme/theme.constants';
import { getClientContextTimezone } from './src/theme/utils/clientContext.utils';

// Test only (branch test/emkit-all): language and locale follow the client context preset,
// and `areaScales` adds a theme-level `scales` override on the area chart.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const themeProvider = (clientContext: any): Theme => {
  const timezone = getClientContextTimezone(clientContext?.timezone);
  const language: string = clientContext?.language ?? 'en';

  return {
    ...remarkableTheme,
    i18n: { ...remarkableTheme.i18n, language },
    formatter: { ...remarkableTheme.formatter, locale: language === 'de' ? 'de-DE' : 'en-US' },
    charts: {
      ...remarkableTheme.charts,
      ...(clientContext?.areaScales
        ? { areaChartPro: { options: { scales: { x: { grid: { display: false } } } } } }
        : {}),
    },
    clientContext: { ...clientContext, timezone },
  };
};

export default themeProvider;
