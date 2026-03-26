import { styles } from '@embeddable.com/remarkable-ui/styles';

const stylesRemarkablePro = {
  // Drilldown Modal
  '--em-drilldown-modal-min-height': '100%',
  '--em-drilldown-modal-width': '100%',
};

export type StylesRemarkablePro = typeof stylesRemarkablePro;

// Merge base styles with remarkable pro styles
export const remarkableThemeStyles = { ...styles, ...stylesRemarkablePro } as const;
