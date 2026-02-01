import { Dimension, Granularity } from '@embeddable.com/core';
import {
  GranularitySelectField,
  GranularitySelectFieldProps,
} from '../../../editors/shared/GranularitySelectField/GranularitySelectField';
import styles from './ChartGranularitySelectField.module.css';
import clsx from 'clsx';

type ChartGranularitySelectFieldProps = Pick<GranularitySelectFieldProps, 'onChange'> & {
  dimension: Dimension;
  hasMarginTop?: boolean;
};

const dimensionGranularities: Granularity[] = ['day', 'week', 'month', 'quarter', 'year'];

export const ChartGranularitySelectField = ({
  dimension,
  hasMarginTop,
  ...props
}: ChartGranularitySelectFieldProps) => {
  const showGranularitySelector = dimension?.inputs?.showGranularityDropdown;

  if (!showGranularitySelector) {
    return null;
  }

  const dimensionTimeRange = dimension.inputs?.dateBounds;
  const dimensionGranularity = dimension.inputs?.granularity;

  return (
    <div
      className={clsx(
        styles.chartGranularitySelectFieldContainer,
        hasMarginTop && styles.marginTop,
      )}
    >
      <GranularitySelectField
        {...props}
        primaryTimeRange={dimensionTimeRange}
        granularity={dimensionGranularity}
        granularities={dimensionGranularities}
        variant="ghost"
        side="bottom"
        align="end"
      />
    </div>
  );
};
