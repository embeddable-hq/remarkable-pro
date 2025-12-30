import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { DataResponse, Dimension, DimensionOrMeasure, OrderDirection } from '@embeddable.com/core';
import { TableScrollable, TableSort } from '@embeddable.com/remarkable-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTableHeaders, getTableRows } from '../tables.utils';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';
import deepEqual from 'fast-deep-equal';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';

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

  const { description, title } = resolveI18nProps(props);
  const {
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

  const [rowsToDisplay, setRowsToDisplay] = useState<any[]>([]); // to ignore unused var warning

  const headers = getTableHeaders({ dimensionsAndMeasures, displayNullAs }, theme);
  const rows = results?.data || [];

  const cardContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!results?.data) return;

    // Only update test data if there are changes
    const lastRows = rowsToDisplay.slice(-1 * TABLE_SCROLLABLE_SIZE);

    if (!deepEqual(lastRows, rows)) {
      setRowsToDisplay((prev) => [...prev, ...rows]);
    }
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

    const rowDimensionValue = rows[rowIndex]?.[clickDimension.name];
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

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      hasTotalResults: false,
    }));
  }, [dimensionsAndMeasures]);

  const handleNextPage = () => {
    if (results.isLoading) return;
    handleUpdateEmbeddableState({ page: state.page + 1 });
  };

  const handleSortChange = (newSort: TableSort<any> | undefined) => {
    setRowsToDisplay([]);
    results.isLoading = true;
    handleUpdateEmbeddableState({ sort: newSort as TableScrollableProState['sort'] });
  };

  const hasMoreData = (results?.data ?? [])?.length > 0;

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
        hasMoreData={hasMoreData}
        onRowIndexClick={handleRowIndexClick}
        headers={headers}
        rows={getTableRows({ rows: rowsToDisplay, clickDimension })}
        showIndex={showIndex}
        page={state.page}
        sort={state.sort}
        isLoading={results?.isLoading}
        loadingLabel={i18n.t('common.loading')}
        onNextPage={handleNextPage}
        onSortChange={handleSortChange}
      />
    </ChartCard>
  );
};

export default TableScrollablePro;
