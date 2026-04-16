import { FC } from 'react';
import { Measure } from '@embeddable.com/core';
import styles from './KpiTab.module.css';
import clsx from 'clsx';
import { Theme } from '../../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../../theme/formatter/formatter.utils';
import { useTheme } from '@embeddable.com/react';

type KpiTabProps = {
  measure: Measure;
  value: number | undefined;
  //comparisonValue?: number | undefined; // TODO: for trend indicator
  isActive: boolean;
  onClick: () => void;
};

export const KpiTab: FC<KpiTabProps> = ({ measure, value, isActive, onClick }) => {
  const theme = useTheme() as Theme;
  const themeFormatter = getThemeFormatter(theme);

  const title = themeFormatter.dimensionOrMeasureTitle(measure);
  const formattedValue = value === undefined ? '-' : themeFormatter.data(measure, value);

  return (
    <button
      className={clsx(styles.tab, isActive && styles.tabActive)}
      onClick={onClick}
      type="button"
    >
      <span className={styles.tabTitle}>{title}</span>
      <span className={styles.tabValue}>{formattedValue}</span>
      {/* TODO: add trend indicator from RUI lib */}
    </button>
  );
};
