import { FC } from 'react';
import { Measure } from '@embeddable.com/core';
import { Theme } from '../../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../../theme/formatter/formatter.utils';
import styles from './MeasureTab.module.css';
import clsx from 'clsx';

type MeasureTabProps = {
  measure: Measure;
  value: number | undefined;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
  theme: Theme;
};

export const MeasureTab: FC<MeasureTabProps> = ({
  measure,
  value,
  isActive,
  isLoading,
  onClick,
  theme,
}) => {
  const themeFormatter = getThemeFormatter(theme);
  const title = themeFormatter.dimensionOrMeasureTitle(measure);
  const formattedValue = value != null ? themeFormatter.data(measure, value) : '';

  return (
    <button
      className={clsx(styles.tab, isActive && styles.tabActive)}
      onClick={onClick}
      type="button"
    >
      <span className={styles.tabTitle}>{title}</span>
      {!isLoading && <span className={styles.tabValue}>{formattedValue}</span>}
    </button>
  );
};
