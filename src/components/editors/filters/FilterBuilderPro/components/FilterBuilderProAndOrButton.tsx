import { FC } from 'react';
import { Tooltip } from '@embeddable.com/remarkable-ui';
import styles from '../FilterBuilderPro.module.css';
import { i18n } from '../../../../../theme/i18n/i18n';
import { filterBuilderAndOrOperator, FilterBuilderAndOrOperator } from '../../filters.utils';

type FilterBuilderProAndOrButtonProps = {
  operator: FilterBuilderAndOrOperator;
  onChange: (value: FilterBuilderAndOrOperator) => void;
  disabled?: boolean;
};

export const FilterBuilderProAndOrButton: FC<FilterBuilderProAndOrButtonProps> = ({
  operator,
  onChange,
  disabled = false,
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

  const button = (
    <button type="button" className={styles.andOrButton} onClick={handleChange} disabled={disabled}>
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
