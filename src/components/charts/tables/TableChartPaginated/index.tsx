import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { DataResponse, Dimension, DimensionOrMeasure, OrderDirection } from '@embeddable.com/core';
import {
  getStyleNumber,
  getTableTotalPages,
  TablePaginated,
  useTableGetRowsPerPage,
  useResizeObserver,
  TableSort,
} from '@embeddable.com/remarkable-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTableHeaders, getTableRows } from '../tables.utils';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

const headerHeight = getStyleNumber('--em-tablechart-cell-height', '2.5rem') as number;
const rowHeight = getStyleNumber('--em-tablechart-cell-height', '2.5rem') as number;
const footerHeight = getStyleNumber('--em-tablechart-pagination-height', '3rem') as number;

let downloadData: (data: DataResponse['data']) => void;

export type TableChartPaginatedProOnRowClickArg = string | null;
export type TableChartPaginatedProState = {
  page: number;
  pageSize?: number;
  sort?: { id: string; direction: OrderDirection } | undefined;
  isLoadingDownloadData: boolean;
  hasTotalResults: boolean;
};

export type TableChartPaginatedProProps = {
  allResults?: DataResponse;
  clickDimension?: Dimension;

  dimensionsAndMeasures: DimensionOrMeasure[];
  displayNullAs?: string;
  results: DataResponse;
  showIndex?: boolean;
  state?: TableChartPaginatedProState;

  totalResults?: DataResponse;
  onRowClicked?: (rowDimensionValue: TableChartPaginatedProOnRowClickArg) => void;
  setState?: React.Dispatch<React.SetStateAction<TableChartPaginatedProState>>;
} & ChartCardHeaderProps;

const TableChartPaginatedPro = (props: TableChartPaginatedProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const [isDownloadingData, setIsDownloadingData] = useState(false);

  const { title, description, tooltip } = resolveI18nProps(props);
  const {
    hideMenu,
    totalResults,
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
  const rows = results?.data || [];
  const tableRows = getTableRows({ rows, clickDimension });
  const cardContentRef = useRef<HTMLDivElement>(null);
  const { height } = useResizeObserver(cardContentRef);
  const pageSize = useTableGetRowsPerPage({
    availableHeight: height,
    headerHeight,
    rowHeight,
    footerHeight,
  });

  // Stable updater for embeddable state
  const handleUpdateEmbeddableState = useCallback(
    (newState: Partial<TableChartPaginatedProState>) => {
      setState?.((prevState) => ({
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
    if (!onRowClicked || !clickDimension) return;

    const rowDimensionValue = rows[rowIndex]?.[clickDimension.name];
    onRowClicked(rowDimensionValue);
  };

  // Sync page size changes to embeddable state
  useEffect(() => {
    if (pageSize) {
      handleUpdateEmbeddableState({ pageSize });
    }
  }, [pageSize, handleUpdateEmbeddableState]);

  // Sync total from results
  useEffect(() => {
    setState?.((prevState) => ({
      ...prevState,
      hasTotalResults: false,
    }));
  }, [dimensionsAndMeasures, pageSize]);

  useEffect(() => {
    if (totalResults?.total) {
      setState?.((prevState) => ({
        ...prevState,
        hasTotalResults: true,
      }));
    }
  }, [totalResults]);

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

  const handleSortChange = (newSort: TableSort<any> | undefined) => {
    handleUpdateEmbeddableState({ sort: newSort as TableChartPaginatedProState['sort'] });
  };

  const currentPage = state?.page ?? 0;
  return (
    <ChartCard
      ref={cardContentRef}
      title={title}
      description={description}
      tooltip={tooltip}
      data={results}
      dimensionsAndMeasures={dimensionsAndMeasures}
      errorMessage={results?.error}
      onCustomDownload={handleCustomDownload}
      hideMenu={hideMenu}
    >
      <TablePaginated
        onRowIndexClick={handleRowIndexClick}
        headers={headers}
        rows={tableRows}
        showIndex={showIndex}
        page={currentPage}
        pageSize={pageSize}
        paginationLabel={i18n.t('charts.tablePaginated.pagination', {
          page: currentPage + 1,
          totalPages: getTableTotalPages(totalResults?.total, pageSize) ?? '?',
        })}
        total={totalResults?.total}
        sort={state?.sort}
        onSortChange={handleSortChange}
        onPageChange={(newPage) => handleUpdateEmbeddableState({ page: newPage })}
      />
    </ChartCard>
  );
};

export default TableChartPaginatedPro;
