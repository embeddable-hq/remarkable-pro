import { IconLoader2 } from '@tabler/icons-react';
import { ThemeComponent } from '../ThemeComponent/ThemeComponent';
import styles from './ChartCardLoading.module.css';

export const ChartCardLoading = () => (
  <ThemeComponent name="ChartCardLoading" fallback={<IconLoader2 className={styles.loading} />} />
);
