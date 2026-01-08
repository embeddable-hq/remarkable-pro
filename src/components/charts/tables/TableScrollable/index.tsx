import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import {
  DataResponse,
  Dataset,
  Dimension,
  DimensionOrMeasure,
  OrderDirection,
} from '@embeddable.com/core';
import { TableScrollable, TableScrollableHandle, TableSort } from '@embeddable.com/remarkable-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTableHeaders, getTableRows } from '../tables.utils';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { deepEqual } from 'fast-equals';

/* eslint-disable @typescript-eslint/no-explicit-any */
let downloadData: (data: DataResponse['data']) => void;

export type TableScrollableProOnRowClickArg = string | null;
export type TableScrollableProState = {
  page: number;
  pageSize?: number;
  sort?: { id: string; direction: OrderDirection } | undefined;
  isLoadingDownloadData: boolean;
};

type TableScrollableProProps = {
  dataset: Dataset;
  allResults?: DataResponse;
  clickDimension?: Dimension;
  description: string;
  dimensionsAndMeasures: DimensionOrMeasure[];
  displayNullAs?: string;
  embeddableState: TableScrollableProState;
  results: DataResponse;
  showIndex: boolean;
  state: TableScrollableProState;
  title: string;
  onRowClicked: (rowDimensionValue: TableScrollableProOnRowClickArg) => void;
  setState: React.Dispatch<React.SetStateAction<TableScrollableProState>>;
};

const TableScrollablePro = (props: TableScrollableProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [rowsToDisplay, setRowsToDisplay] = useState<any[]>([]);

  const { description, title } = resolveI18nProps(props);
  const {
    dataset,
    results,
    allResults,
    dimensionsAndMeasures,
    displayNullAs,
    showIndex,
    clickDimension,
    state,
    setState,
    onRowClicked,
  } = props;

  const headers = getTableHeaders({ dimensionsAndMeasures, displayNullAs }, theme);
  const rows = results?.data ?? [];

  const cardContentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<TableScrollableHandle | null>(null);
  const firstLoadPending = useRef(true);
  const lastDatasetVariableRef = useRef<Dataset['variableValues'] | null>(null);

  useEffect(() => {
    if (deepEqual(dataset.variableValues, lastDatasetVariableRef.current)) {
      return;
    }

    // Reset to first page when dataset variable values change
    firstLoadPending.current = true;
    lastDatasetVariableRef.current = dataset.variableValues;
    setState((prevState) => ({
      ...prevState,
      page: 0,
    }));
  }, [dataset.variableValues]);

  useEffect(() => {
    if (!results?.data) return;

    // First is pending
    if (firstLoadPending.current) {
      setRowsToDisplay([...rows]);
      firstLoadPending.current = false;
      tableRef.current?.scrollToTop('smooth');
      return;
    }

    // Append new rows
    setRowsToDisplay((prev) => [...prev, ...rows]);
  }, [rows]);

  // Stable updater for embeddable state
  const handleUpdateEmbeddableState = useCallback(
    (newState: Partial<TableScrollableProState>) => {
      setState((prevState) => ({
        ...prevState,
        ...newState,
      }));
    },
    [setState],
  );

  const handleCustomDownload = (onDownload: (props: ChartCardMenuOptionOnClickProps) => void) => {
    setIsDownloadingData(true);
    handleUpdateEmbeddableState({ isLoadingDownloadData: true });

    downloadData = (data: DataResponse['data']) =>
      onDownload({
        title,
        data,
        dimensionsAndMeasures,
        containerRef: cardContentRef,
        theme,
      });
  };

  const handleRowIndexClick = (rowIndex: number) => {
    if (!clickDimension) return;

    const rowDimensionValue = rowsToDisplay[rowIndex]?.[clickDimension.name];
    onRowClicked(rowDimensionValue);
  };

  // Handle data download when allResults is ready
  useEffect(() => {
    if (isDownloadingData) {
      if (!allResults || allResults.isLoading) {
        // Loading data to download
        return;
      }

      downloadData(allResults.data);
      setIsDownloadingData(false);
      handleUpdateEmbeddableState({ isLoadingDownloadData: false });
    }
  }, [isDownloadingData, allResults, handleUpdateEmbeddableState]);

  const handleNextPage = () => {
    if (results.isLoading) return;
    handleUpdateEmbeddableState({ page: state.page + 1 });
  };

  const handleSortChange = (newSort: TableSort<any> | undefined) => {
    firstLoadPending.current = true;
    handleUpdateEmbeddableState({ sort: newSort as TableScrollableProState['sort'], page: 0 });
  };

  const hasMoreData = results?.data && results.data.length === TABLE_SCROLLABLE_SIZE;
  const isLoading = Boolean(results?.isLoading || allResults?.isLoading);

  return (
    <ChartCard
      ref={cardContentRef}
      title={title}
      subtitle={description}
      data={{
        isLoading,
        data: rowsToDisplay,
      }}
      dimensionsAndMeasures={dimensionsAndMeasures}
      errorMessage={results?.error}
      onCustomDownload={handleCustomDownload}
    >
      <TableScrollable
        ref={tableRef}
        hasMoreData={hasMoreData}
        onRowIndexClick={handleRowIndexClick}
        headers={headers}
        rows={getTableRows({ rows: rowsToDisplay, clickDimension })}
        showIndex={showIndex}
        sort={state.sort}
        isLoading={results?.isLoading && !firstLoadPending.current}
        loadingLabel={i18n.t('common.loading')}
        onNextPage={handleNextPage}
        onSortChange={handleSortChange}
      />
    </ChartCard>
  );
};

export default TableScrollablePro;
