import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { Fragment, useState } from 'react';
import { SingleSelectField, Tooltip } from '@embeddable.com/remarkable-ui';
import { IconPlus } from '@tabler/icons-react';
import clsx from 'clsx';
import { Theme } from '../../../../../theme/theme.types';
import { i18n } from '../../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../../utils/dimensionsAndMeasures.utils';
import {
  FilterBuilderAndOrOperator,
  FilterBuilderFilter,
  getSupportedDimensionsAndMeasures,
} from '../../filters.utils';
import {
  FilterBuilderGroup,
  filterByMemberType,
  getGroupMemberType,
} from '../FilterBuilderWithGroupingPro.utils';
import FilterBuilderWithGroupingItem from './FilterBuilderWithGroupingItem';
import { FilterBuilderWithGroupingAndOrButton } from './FilterBuilderWithGroupingAndOrButton';
import styles from '../FilterBuilderWithGroupingPro.module.css';

type FilterBuilderWithGroupingGroupProps = {
  group: FilterBuilderGroup;
  dimensionsAndMeasures: DimensionOrMeasure[];
  theme: Theme;
  disableOr: boolean;
  results: (filterId: number) => DataResponse | undefined;
  onOperatorChange: (operator: FilterBuilderAndOrOperator) => void;
  // Keyed by the filter's stable id rather than its array position, so an
  // in-flight callback (e.g. a debounced value update) can't land on the wrong
  // filter if the group's contents were deleted/reordered in the meantime.
  onSelectDimensionOrMeasure: (filterId: number, value: string | null) => void;
  onSelectOperator: (filterId: number, value: string | null) => void;
  onSelectValue: (filterId: number, value: FilterBuilderFilter['value']) => void;
  onSearchValue: (filterId: number, value: string) => void;
  onDeleteFilter: (filterId: number) => void;
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

  // The member type this group is already locked to (Cube can't combine
  // dimensions and measures in one logical operator, so a group must stay
  // single-type). Null while the group has no members yet.
  const groupMemberType = getGroupMemberType(group.filters);

  const options = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: filterByMemberType(
      getSupportedDimensionsAndMeasures(dimensionsAndMeasures),
      groupMemberType,
    ),
    searchValue: search,
    theme,
  });

  // The trailing "+" control that lets the user add another filter to this
  // group — the pill's end cap, appended after the last filter.
  const addToGroupControl = (
    <Tooltip
      side="top"
      trigger={
        <span>
          <SingleSelectField
            triggerComponent={
              <button
                type="button"
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
            onSelectDimensionOrMeasure={(value) => onSelectDimensionOrMeasure(filter.id, value)}
            onSelectOperator={(value) => onSelectOperator(filter.id, value)}
            onSelectValue={(value) => onSelectValue(filter.id, value)}
            onSearchValue={(value) => onSearchValue(filter.id, value)}
            onDelete={() => onDeleteFilter(filter.id)}
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
                {addToGroupControl}
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
