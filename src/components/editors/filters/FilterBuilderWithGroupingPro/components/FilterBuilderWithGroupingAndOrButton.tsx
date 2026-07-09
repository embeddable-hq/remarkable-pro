import { FC } from 'react';
import { Tooltip } from '@embeddable.com/remarkable-ui';
import clsx from 'clsx';
import styles from '../FilterBuilderWithGroupingPro.module.css';
import { i18n } from '../../../../../theme/i18n/i18n';
import { FilterBuilderAndOrOperator, filterBuilderAndOrOperator } from '../../filters.utils';

type FilterBuilderWithGroupingAndOrButtonProps = {
  operator: FilterBuilderAndOrOperator;
  onChange: (value: FilterBuilderAndOrOperator) => void;
  disabled?: boolean;
  inGroup?: boolean;
};

export const FilterBuilderWithGroupingAndOrButton: FC<
  FilterBuilderWithGroupingAndOrButtonProps
> = ({ operator, onChange, disabled = false, inGroup = false }) => {
  const handleChange = () => {
    onChange(
      operator === filterBuilderAndOrOperator.AND
        ? filterBuilderAndOrOperator.OR
        : filterBuilderAndOrOperator.AND,
    );
  };
  const andLabel = i18n.t('editors.filterBuilder.and');
  const orLabel = i18n.t('editors.filterBuilder.or');
  const activeLabel = operator === filterBuilderAndOrOperator.AND ? andLabel : orLabel;
  const inactiveLabel = operator === filterBuilderAndOrOperator.AND ? orLabel : andLabel;

  const button = (
    <button
      type="button"
      className={clsx(styles.andOrButton, inGroup && styles.andOrButtonInGroup)}
      onClick={handleChange}
      disabled={disabled}
    >
      <span>{activeLabel}</span>
      <span className={styles.andOrButtonSizer} aria-hidden>
        {inactiveLabel}
      </span>
    </button>
  );

  if (!disabled) {
    return button;
  }

  return (
    <Tooltip side="top" trigger={<span>{button}</span>}>
      {i18n.t('editors.filterBuilder.disableOrOperatorToolTip')}
    </Tooltip>
  );
};
