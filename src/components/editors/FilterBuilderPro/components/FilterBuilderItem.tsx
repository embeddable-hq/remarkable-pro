import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { FilterBuilderFilter } from '../definition';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import { useState } from 'react';
import { i18n } from '../../../../theme/i18n/i18n';
import FilterBuilderItemOperatorValueFields from './FilterBuilderItemOperatorValueFields';
import styles from '../FilterBuilderPro.module.css';
import { IconPlus, IconX } from '@tabler/icons-react';
import { getSupportedDimensionsAndMeasures } from '../FilterBuilderPro.utils';

type FilterBuilderItemProps = {
  filter: FilterBuilderFilter;
  dimensionsAndMeasures: DimensionOrMeasure[];
  results?: DataResponse;
  theme: Theme;
  onSelectDimensionOrMeasure: (value: string | null) => void;
  onSelectOperator: (value: string | null) => void;
  onSelectValue: (value: FilterBuilderFilter['value']) => void;
  onSearchValue: (value: string) => void;
  onDelete: () => void;
};

const FilterBuilderItem = ({
  filter,
  dimensionsAndMeasures,
  results,
  theme,
  onSelectDimensionOrMeasure,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
  onDelete,
}: FilterBuilderItemProps) => {
  const { dimensionOrMeasure } = filter;
  const [search, setSearch] = useState<string>('');

  const supportedDimensionsAndMeasures = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);

  const allDimensionOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    theme,
  });

  const dimensionOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: search,
    theme,
  });

  const selectedLabel = allDimensionOptions.find(
    (o) => o.value === dimensionOrMeasure?.name,
  )?.label;

  const getMemberTriggerComponent = () => {
    if (dimensionOrMeasure) {
      return <button className={styles.memberButton}>{selectedLabel}</button>;
    }

    return (
      <button className={styles.addButton}>
        <IconPlus />
        <span>{i18n.t('editors.filterBuilder.addFilter')}</span>
      </button>
    );
  };

  return (
    <div className={styles.filter}>
      <SingleSelectField
        triggerComponent={getMemberTriggerComponent()}
        searchable
        value={dimensionOrMeasure?.name}
        onChange={onSelectDimensionOrMeasure}
        onSearch={setSearch}
        options={dimensionOptions}
        avoidCollisions={false}
        noOptionsMessage={i18n.t('common.noOptionsFound')}
      />

      {dimensionOrMeasure && (
        <>
          <FilterBuilderItemOperatorValueFields
            dimensionOrMeasure={dimensionOrMeasure}
            filter={filter}
            results={results}
            theme={theme}
            onSelectOperator={onSelectOperator}
            onSelectValue={onSelectValue}
            onSearchValue={onSearchValue}
          />
          <button className={styles.deleteButton} onClick={onDelete}>
            <IconX />
          </button>
        </>
      )}
    </div>
  );
};

export default FilterBuilderItem;
