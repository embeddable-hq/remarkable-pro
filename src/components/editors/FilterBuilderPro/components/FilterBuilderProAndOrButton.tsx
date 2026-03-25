import { FC } from 'react';
import styles from '../FilterBuilderPro.module.css';
import { FilterBuilderOperator, filterBuilderOperator } from '../FilterBuilderPro.utils';
import { i18n } from '../../../../theme/i18n/i18n';

type FilterBuilderProAndOrButtonProps = {
  operator: FilterBuilderOperator;
  onChange: (value: FilterBuilderOperator) => void;
};

export const FilterBuilderProAndOrButton: FC<FilterBuilderProAndOrButtonProps> = ({
  operator,
  onChange,
}) => {
  const handleChange = () => {
    onChange(
      operator === filterBuilderOperator.AND ? filterBuilderOperator.OR : filterBuilderOperator.AND,
    );
  };
  const andLabel = i18n.t('editors.filterBuilder.and');
  const orLabel = i18n.t('or');
  const activeLabel = operator === filterBuilderOperator.AND ? andLabel : orLabel;
  const inactiveLabel = operator === filterBuilderOperator.AND ? orLabel : andLabel;

  return (
    <button className={styles.andOrButton} onClick={handleChange}>
      <span>{activeLabel}</span>
      <span className={styles.andOrButtonSizer} aria-hidden>
        {inactiveLabel}
      </span>
    </button>
  );
};
