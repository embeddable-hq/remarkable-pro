import { FC } from 'react';
import { Measure } from '@embeddable.com/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { KpiTab } from './KpiTab/KpiTab';
import styles from './KpiTabs.module.css';
import { ActionIcon } from '@embeddable.com/remarkable-ui';
import { useHorizontalScroll } from '../../../../hooks/useHorizontalScroll.hooks';

type KpiTabsProps = {
  measures: Measure[];
  kpiValues: Record<Measure['name'], number> | undefined;
  activeMeasureName: string;
  onChange: (measureName: string) => void;
};

export const KpiTabs: FC<KpiTabsProps> = ({ measures, kpiValues, activeMeasureName, onChange }) => {
  const { scrollRef, canScrollLeft, canScrollRight, handleScrollLeft, handleScrollRight } =
    useHorizontalScroll();

  return (
    <div className={styles.tabsContainer}>
      {canScrollLeft && (
        <ActionIcon
          icon={IconChevronLeft}
          className={styles.scrollLeftButton}
          onClick={handleScrollLeft}
        />
      )}
      <div className={styles.tabsScroll} ref={scrollRef}>
        {measures.map((measure) => (
          <KpiTab
            key={measure.name}
            measure={measure}
            value={kpiValues?.[measure.name]}
            isActive={measure.name === activeMeasureName}
            onClick={() => onChange(measure.name)}
          />
        ))}
      </div>
      {canScrollRight && (
        <ActionIcon
          icon={IconChevronRight}
          className={styles.scrollRightButton}
          onClick={handleScrollRight}
        />
      )}
    </div>
  );
};
