import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Theme } from '../../../../../theme/theme.types';
import { MeasureTab } from './MeasureTab';
import styles from './MeasureTabs.module.css';

type MeasureTabsProps = {
  measures: Measure[];
  resultsTotals: DataResponse;
  activeMeasureIndex: number;
  onTabClick: (index: number) => void;
  theme: Theme;
};

export const MeasureTabs: FC<MeasureTabsProps> = ({
  measures,
  resultsTotals,
  activeMeasureIndex,
  onTabClick,
  theme,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollState);
    updateScrollState();
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState, measures]);

  const totalsRow = resultsTotals?.data?.[0];
  const isLoading = !resultsTotals || resultsTotals.isLoading;

  return (
    <div className={styles.tabsContainer}>
      {canScrollLeft && (
        <button className={styles.scrollLeftButton} onClick={handleScrollLeft} type="button">
          <IconChevronLeft />
        </button>
      )}
      <div className={styles.tabsScroll} ref={scrollRef}>
        {measures.map((measure, index) => (
          <MeasureTab
            key={measure.name}
            measure={measure}
            value={totalsRow?.[measure.name]}
            isActive={index === activeMeasureIndex}
            isLoading={Boolean(isLoading)}
            onClick={() => onTabClick(index)}
            theme={theme}
          />
        ))}
      </div>
      {canScrollRight && (
        <button className={styles.scrollRightButton} onClick={handleScrollRight} type="button">
          <IconChevronRight />
        </button>
      )}
    </div>
  );
};
