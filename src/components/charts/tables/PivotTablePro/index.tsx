import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { PivotTable } from '@embeddable.com/remarkable-ui';
import { useEffect, useRef, useState } from 'react';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import {
  getPivotColumnTotalsFor,
  getPivotDimension,
  getPivotMeasures,
  getPivotRowTotalsFor,
} from './PivotPro.utils';
import { useGetTableSortedResults } from '../tables.hooks';
import { sortArrayByProp } from '../../../../utils/array.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

type PivotTableProProps = {
  results: DataResponse;
  results2?: DataResponse;
  measures: Measure[];
  rowDimension: Dimension;
  rowDimension2?: Dimension;
  columnDimension: Dimension;
  displayNullAs?: string;
  columnWidth?: number;
  firstColumnWidth?: number;
  expandedRowKeys: string[];
  setExpandedRowKey: (expandedRowKeys: string) => void;
} & ChartCardHeaderProps;

const PivotTablePro = (props: PivotTableProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip } = resolveI18nProps(props);
  const {
    results2,
    measures,
    rowDimension,
    rowDimension2,
    columnDimension,
    displayNullAs,
    columnWidth,
    firstColumnWidth,
    hideMenu,
    expandedRowKeys,
    setExpandedRowKey,
  } = props;

  const columnOrder = Array.from(
    new Set((props.results.data ?? []).filter(Boolean).map((d) => d[columnDimension.name])),
  );

  const rowOrder = Array.from(
    new Set((props.results.data ?? []).filter(Boolean).map((d) => d[rowDimension.name])),
  );

  // Fill gaps for the column dimension
  const resultsColumnDimensionFillGaps = useFillGaps({
    results: props.results,
    dimension: columnDimension,
  });

  // Fill gaps for the row dimension
  const resultsRowColumnDimensionFillGaps = useFillGaps({
    results: resultsColumnDimensionFillGaps,
    dimension: rowDimension,
  });

  const results = useGetTableSortedResults({
    results: resultsRowColumnDimensionFillGaps,
    columnOrder,
    rowOrder,
    columnDimension,
    rowDimension,
    measures,
  });

  const cardContentRef = useRef<HTMLDivElement>(null);

  const pivotMeasures = getPivotMeasures({ measures, displayNullAs }, theme);
  const pivotRowDimension = getPivotDimension({ dimension: rowDimension }, theme);
  const pivotRowDimension2 = rowDimension2
    ? getPivotDimension({ dimension: rowDimension2 }, theme)
    : undefined;
  const pivotColumnDimension = getPivotDimension({ dimension: columnDimension }, theme);
  const pivotColumnTotalsFor = getPivotColumnTotalsFor(measures);
  const pivotRowTotalsFor = getPivotRowTotalsFor(measures);

  const [loadingRows, setLoadingRows] = useState(new Set<string>());
  const [subRowsByRow, setSubRowsByRow] = useState(new Map<string, any[]>());

  const handleRowExpand = (rowKey: string) => {
    setLoadingRows((prev) => new Set(prev).add(rowKey));
    setExpandedRowKey(rowKey);
  };

  useEffect(() => {
    // No results or no expandedRowKeys, nothing to load
    if (!results2 || !results2?.data || expandedRowKeys.length === 0) {
      return;
    }

    const subRowsByRowData = new Map<string, any[]>();
    expandedRowKeys.forEach((rowKey) => {
      const containsSubRow = results2.data?.some((row) => row[rowDimension.name] === rowKey);
      if (!containsSubRow) return;

      const subRows = results2.data?.filter((row) => row[rowDimension.name] === rowKey) ?? [];
      const subRowsSorted = rowDimension2
        ? sortArrayByProp(subRows, rowDimension2.name, 'asc')
        : subRows;

      subRowsByRowData.set(rowKey, subRowsSorted);

      setLoadingRows((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    });
    setSubRowsByRow(subRowsByRowData);
  }, [results2, expandedRowKeys, setLoadingRows]);

  return (
    <ChartCard
      ref={cardContentRef}
      title={title}
      description={description}
      tooltip={tooltip}
      data={props.results}
      dimensionsAndMeasures={[rowDimension, columnDimension, ...measures]}
      errorMessage={props.results?.error}
      hideMenu={hideMenu}
    >
      <PivotTable
        firstColumnWidth={firstColumnWidth}
        columnWidth={columnWidth}
        totalLabel={i18n.t('charts.pivotTable.total')}
        data={results}
        measures={pivotMeasures}
        rowDimension={pivotRowDimension}
        columnDimension={pivotColumnDimension}
        columnTotalsFor={pivotColumnTotalsFor}
        rowTotalsFor={pivotRowTotalsFor}
        expandableRows={Boolean(rowDimension2)}
        subRowsByRow={subRowsByRow}
        loadingRows={loadingRows}
        onRowExpand={handleRowExpand}
        subRowDimension={pivotRowDimension2}
      />
    </ChartCard>
  );
};

export default PivotTablePro;
