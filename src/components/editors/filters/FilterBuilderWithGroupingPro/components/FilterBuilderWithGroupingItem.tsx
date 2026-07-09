import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useState } from 'react';
import { SingleSelectField, Tooltip } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconX } from '@tabler/icons-react';
import clsx from 'clsx';
import { Theme } from '../../../../../theme/theme.types';
import { i18n } from '../../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../../utils/dimensionsAndMeasures.utils';
import { FilterBuilderFilter, getSupportedDimensionsAndMeasures } from '../../filters.utils';
import FilterBuilderItemOperatorValueFields from '../../components/FilterBuilderItemOperatorValueFields';
import { FilterBuilderMemberType, filterByMemberType } from '../FilterBuilderWithGroupingPro.utils';
import styles from '../FilterBuilderWithGroupingPro.module.css';

type FilterBuilderWithGroupingItemProps = {
  filter: FilterBuilderFilter;
  dimensionsAndMeasures: DimensionOrMeasure[];
  results?: DataResponse;
  theme: Theme;
  inGroup?: boolean;
  allowedMemberType?: FilterBuilderMemberType | null;
  roundEnd?: boolean;
  onSelectDimensionOrMeasure: (value: string | null) => void;
  onSelectOperator: (value: string | null) => void;
  onSelectValue: (value: FilterBuilderFilter['value']) => void;
  onSearchValue: (value: string) => void;
  onDelete: () => void;
  onCreateGroup?: (value: string | null) => void;
};

const FilterBuilderWithGroupingItem = ({
  filter,
  dimensionsAndMeasures,
  results,
  theme,
  inGroup = false,
  allowedMemberType,
  roundEnd = true,
  onSelectDimensionOrMeasure,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
  onDelete,
  onCreateGroup,
}: FilterBuilderWithGroupingItemProps) => {
  const { dimensionOrMeasure } = filter;
  const [search, setSearch] = useState<string>('');

  const canCreateGroup = !inGroup && Boolean(onCreateGroup);

  const supported = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);

  const allDimensionOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supported,
    theme,
  });

  const dimensionOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: filterByMemberType(supported, allowedMemberType),
    searchValue: search,
    theme,
  });

  const createGroupOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: filterByMemberType(supported, dimensionOrMeasure?.__type__),
    searchValue: search,
    theme,
  });

  const selectedLabel = allDimensionOptions.find(
    (o) => o.value === dimensionOrMeasure?.name,
  )?.label;

  const memberTrigger = dimensionOrMeasure ? (
    <button type="button" className={styles.memberButton}>
      {selectedLabel}
    </button>
  ) : (
    <button type="button" className={styles.addButton}>
      <IconPlus />
      <span>{i18n.t('editors.filterBuilder.addFilter')}</span>
    </button>
  );

  return (
    <div className={styles.filter}>
      <SingleSelectField
        triggerComponent={memberTrigger}
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
            styles={styles}
            showInlineClear={false}
          />
          <Tooltip
            side="top"
            trigger={
              <button
                type="button"
                className={clsx(
                  styles.deleteButton,
                  !canCreateGroup && roundEnd && styles.roundedRight,
                )}
                onClick={onDelete}
                aria-label={i18n.t('editors.filterBuilder.deleteFilter')}
              >
                <IconX />
              </button>
            }
          >
            {i18n.t('editors.filterBuilder.deleteFilter')}
          </Tooltip>
          {canCreateGroup && (
            <Tooltip
              side="top"
              trigger={
                <span>
                  <SingleSelectField
                    triggerComponent={
                      <button
                        type="button"
                        className={clsx(styles.createGroupButton, styles.roundedRight)}
                        aria-label={i18n.t('editors.filterBuilder.createFilterGroup')}
                      >
                        <IconPlus />
                      </button>
                    }
                    searchable
                    onChange={(value) => onCreateGroup?.(value)}
                    onSearch={setSearch}
                    options={createGroupOptions}
                    avoidCollisions={false}
                    noOptionsMessage={i18n.t('common.noOptionsFound')}
                  />
                </span>
              }
            >
              {i18n.t('editors.filterBuilder.createFilterGroup')}
            </Tooltip>
          )}
        </>
      )}
    </div>
  );
};

export default FilterBuilderWithGroupingItem;
