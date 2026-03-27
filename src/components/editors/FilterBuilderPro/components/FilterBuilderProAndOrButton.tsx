import { FC } from 'react';
import styles from '../FilterBuilderPro.module.css';
import { i18n } from '../../../../theme/i18n/i18n';
import { filterBuilderAndOrOperator, FilterBuilderAndOrOperator } from '../FilterBuilderPro.utils';

type FilterBuilderProAndOrButtonProps = {
  operator: FilterBuilderAndOrOperator;
  onChange: (value: FilterBuilderAndOrOperator) => void;
};

export const FilterBuilderProAndOrButton: FC<FilterBuilderProAndOrButtonProps> = ({
  operator,
  onChange,
}) => {
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

  return (
    <button className={styles.andOrButton} onClick={handleChange}>
      <span>{activeLabel}</span>
      <span className={styles.andOrButtonSizer} aria-hidden>
        {inactiveLabel}
      </span>
    </button>
  );
};
