import { Theme } from './src/theme/theme.types';
import { remarkableTheme } from './src/theme/theme.constants';
import { getClientContextTimezone } from './src/theme/utils/clientContext.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const themeProvider = (clientContext: any): Theme => {
  const timezone = getClientContextTimezone(clientContext?.timezone);

  return {
    ...remarkableTheme,
    clientContext: { ...clientContext, timezone },
    charts: {
      ...remarkableTheme.charts,
      avoidFormattingOnTooltip: true,
      avoidFormattingOnDatalabels: true,
      avoidFormattingOnLabels: true,
      avoidFormattingOnExport: true,
    },
  };
};

export default themeProvider;
