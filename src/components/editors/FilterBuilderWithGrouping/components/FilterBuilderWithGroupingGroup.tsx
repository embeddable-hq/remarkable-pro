import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { Fragment, useState } from 'react';
import { SingleSelectField, Tooltip } from '@embeddable.com/remarkable-ui';
import { IconPlus } from '@tabler/icons-react';
import clsx from 'clsx';
import { Theme } from '../../../../theme/theme.types';
import { i18n } from '../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import {
  FilterBuilderAndOrOperator,
  FilterBuilderFilter,
  getSupportedDimensionsAndMeasures,
} from '../../utils/filterBuilder.utils';
import {
  FilterBuilderGroup,
  filterByMemberType,
  getGroupMemberType,
} from '../FilterBuilderWithGrouping.utils';
import FilterBuilderWithGroupingItem from './FilterBuilderWithGroupingItem';
import { FilterBuilderWithGroupingAndOrButton } from './FilterBuilderWithGroupingAndOrButton';
import styles from '../FilterBuilderWithGrouping.module.css';

type FilterBuilderWithGroupingGroupProps = {
  group: FilterBuilderGroup;
  dimensionsAndMeasures: DimensionOrMeasure[];
  theme: Theme;
  disableOr: boolean;
  results: (filterId: number) => DataResponse | undefined;
  onOperatorChange: (operator: FilterBuilderAndOrOperator) => void;
  onSelectDimensionOrMeasure: (filterIndex: number, value: string | null) => void;
  onSelectOperator: (filterIndex: number, value: string | null) => void;
  onSelectValue: (filterIndex: number, value: FilterBuilderFilter['value']) => void;
  onSearchValue: (filterIndex: number, value: string) => void;
  onDeleteFilter: (filterIndex: number) => void;
  onAddFilter: (value: string | null) => void;
};

export const FilterBuilderWithGroupingGroup = ({
  group,
  dimensionsAndMeasures,
  theme,
  disableOr,
  results,
  onOperatorChange,
  onSelectDimensionOrMeasure,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
  onDeleteFilter,
  onAddFilter,
}: FilterBuilderWithGroupingGroupProps) => {
  const [search, setSearch] = useState('');

  const lockedType = getGroupMemberType(group.filters);

  const options = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: filterByMemberType(
      getSupportedDimensionsAndMeasures(dimensionsAndMeasures),
      lockedType,
    ),
    searchValue: search,
    theme,
  });

  const extender = (
    <Tooltip
      side="top"
      trigger={
        <span>
          <SingleSelectField
            triggerComponent={
              <button
                className={clsx(styles.createGroupButton, styles.roundedRight)}
                aria-label={i18n.t('editors.filterBuilder.addToFilterGroup')}
              >
                <IconPlus />
              </button>
            }
            searchable
            onChange={onAddFilter}
            onSearch={setSearch}
            options={options}
            noOptionsMessage={i18n.t('common.noOptionsFound')}
          />
        </span>
      }
    >
      {i18n.t('editors.filterBuilder.addToFilterGroup')}
    </Tooltip>
  );

  return (
    <div className={styles.group}>
      {group.filters.map((filter, index) => {
        const isLast = index === group.filters.length - 1;
        const item = (
          <FilterBuilderWithGroupingItem
            inGroup
            roundEnd={!isLast}
            allowedMemberType={getGroupMemberType(group.filters, index)}
            filter={filter}
            dimensionsAndMeasures={dimensionsAndMeasures}
            results={results(filter.id)}
            theme={theme}
            onSelectDimensionOrMeasure={(value) => onSelectDimensionOrMeasure(index, value)}
            onSelectOperator={(value) => onSelectOperator(index, value)}
            onSelectValue={(value) => onSelectValue(index, value)}
            onSearchValue={(value) => onSearchValue(index, value)}
            onDelete={() => onDeleteFilter(index)}
          />
        );

        return (
          <Fragment key={filter.id}>
            {index > 0 && (
              <FilterBuilderWithGroupingAndOrButton
                inGroup
                operator={group.operator}
                onChange={onOperatorChange}
                disabled={disableOr}
              />
            )}
            {isLast ? (
              <div className={styles.filter}>
                {item}
                {extender}
              </div>
            ) : (
              item
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default FilterBuilderWithGroupingGroup;
