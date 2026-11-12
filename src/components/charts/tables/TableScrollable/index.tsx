import { HeightMode, useEmbeddableLayout, useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import {
  DataResponse,
  Dataset,
  Dimension,
  DimensionOrMeasure,
  isDimension,
  isMeasure,
  OrderDirection,
  TimeRange,
} from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../../../utils/events.utils';
import { DimensionValueOrTimeRange } from '../../charts.types';
import { TableScrollable, TableScrollableHandle, TableSort } from '@embeddable.com/remarkable-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTableHeaders, getTableRows } from '../tables.utils';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { isAutoHeight } from './TableScrollable.autoHeight';
import { deepEqual } from 'fast-equals';
import styles from './TableScrollable.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
let downloadData: (data: DataResponse['data']) => void;

export type TableScrollableProOnRowClickArg = {
  dimensionValue: string | null | undefined;
  dimensionTimeRange: TimeRange | undefined;
};
export type TableScrollableProState = {
  page: number;
  pageSize?: number;
  sort?: { id: string; direction: OrderDirection } | undefined;
  isLoadingDownloadData: boolean;
  heightMode?: HeightMode;
};

export type TableScrollableProProps = {
  dataset: Dataset;
  allResults?: DataResponse;
  clickDimension?: Dimension;

  dimensionsAndMeasures: DimensionOrMeasure[];
  displayNullAs?: string;
  results: DataResponse;
  showIndex?: boolean;
  state?: TableScrollableProState;

  onRowClicked?: (rowDimensionValue: TableScrollableProOnRowClickArg) => void;
  setState?: React.Dispatch<React.SetStateAction<TableScrollableProState>>;
  componentName?: string;
  trackingId?: string;
} & ChartCardHeaderProps;

const TableScrollablePro = (props: TableScrollableProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const [isDownloadingData, setIsDownloadingData] = useState(false);
  // Rows by page number. Writing a page twice gives the same result, so a
  // re-run effect (React StrictMode runs them twice) can't duplicate rows.
  const [pages, setPages] = useState<Record<number, any[]>>({});
  const rowsToDisplay = useMemo(
    () =>
      Object.keys(pages)
        .map(Number)
        .sort((a, b) => a - b)
        .flatMap((page) => pages[page] ?? []),
    [pages],
  );

  const resolvedI18nProps = resolveI18nProps(props);
  const { title } = resolvedI18nProps;
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
    componentName,
    trackingId,
    onRowClicked,
  } = props;

  const { heightMode } = useEmbeddableLayout();
  const isAutoHeightMode = isAutoHeight(heightMode);

  const headers = getTableHeaders({ dimensionsAndMeasures, displayNullAs }, theme);

  const cardContentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<TableScrollableHandle | null>(null);
  const lastDatasetVariableRef = useRef<Dataset['variableValues'] | null>(null);

  useEffect(() => {
    if (deepEqual(dataset.variableValues, lastDatasetVariableRef.current)) {
      return;
    }

    // Reset to first page when dataset variable values change
    lastDatasetVariableRef.current = dataset.variableValues;
    setState?.((prevState) => ({
      ...prevState,
      page: 0,
    }));
  }, [dataset.variableValues]);

  // Runs only when a response arrives, not when state.page changes: the page
  // goes up before its rows load, and the rows on hand still belong to the page before.
  const page = isAutoHeightMode ? 0 : (state?.page ?? 0);
  useEffect(() => {
    if (!results?.data || results.isLoading) return;
    const pageRows = results.data;
    // Page 0 starts the list again: first load, sort, variable or height-mode change.
    // In auto height each response is the whole allowance, so it is always page 0.
    setPages((prev) => (page === 0 ? { 0: pageRows } : { ...prev, [page]: pageRows }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results?.data, results?.isLoading]);

  const firstPage = pages[0];
  useEffect(() => {
    if (firstPage) tableRef.current?.scrollToTop('smooth');
  }, [firstPage]);

  // Stable updater for embeddable state
  const handleUpdateEmbeddableState = useCallback(
    (newState: Partial<TableScrollableProState>) => {
      setState?.((prevState) => ({
        ...prevState,
        ...newState,
      }));
    },
    [setState],
  );

  // `props()` cannot call hooks, so this is how the query gets to see the mode at all.
  // A new mode fetches its own first page, so paging starts again.
  useEffect(() => {
    if (state?.heightMode !== heightMode) {
      handleUpdateEmbeddableState({ heightMode, page: 0 });
    }
  }, [heightMode, state?.heightMode, handleUpdateEmbeddableState]);

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
    const row = rowsToDisplay[rowIndex];

    let dimensionValue = clickDimension ? row?.[clickDimension.name] : undefined;
    const dimensionTimeRange = clickDimension
      ? getTimeRangeFromDimensionValue({
          value: dimensionValue ?? undefined,
          dimension: clickDimension,
        })
      : undefined;

    let dimensionValueOrTimeRange: DimensionValueOrTimeRange = dimensionValue ?? undefined;
    if (dimensionTimeRange) {
      dimensionValue = undefined;
      dimensionValueOrTimeRange = dimensionTimeRange;
    }

    const measures = dimensionsAndMeasures.filter(isMeasure);
    const measureValues = measures.reduce<Record<string, unknown>>((acc, measure) => {
      acc[measure.name] = row?.[measure.name];
      return acc;
    }, {});

    const dimensions = dimensionsAndMeasures.filter(isDimension);
    const dimensionValues = dimensions.reduce<Record<string, unknown>>((acc, dim) => {
      acc[dim.name] = row?.[dim.name];
      return acc;
    }, {});

    dispatchEventUserInteraction({
      componentName,
      trackingId,
      dimension: clickDimension,
      dimensionValue: dimensionValueOrTimeRange,
      dimensions,
      dimensionValues,
      measures,
      measureValues,
    });

    if (!clickDimension) return;

    onRowClicked?.({ dimensionValue, dimensionTimeRange });
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
    if (results.isLoading || isAutoHeightMode) return;
    handleUpdateEmbeddableState({ page: (state?.page ?? 0) + 1 });
  };

  const handleSortChange = (newSort: TableSort<any> | undefined) => {
    handleUpdateEmbeddableState({ sort: newSort as TableScrollableProState['sort'], page: 0 });
  };

  // No scroll box in auto height, so there is nothing to prefetch for.
  const hasMoreData =
    !isAutoHeightMode && results?.data && results.data.length === TABLE_SCROLLABLE_SIZE;
  const isLoading = Boolean(results?.isLoading || allResults?.isLoading);
  // Later pages load inside the table; the first page loads the whole card.
  const isLoadingTable = results?.isLoading && page > 0;

  const totalRows = results?.total;
  // Match the cells, which the theme's locale formats rather than the browser's.
  const themeFormatter = getThemeFormatter(theme);
  const truncatedRowsLabel =
    isAutoHeightMode && totalRows !== undefined && totalRows > rowsToDisplay.length
      ? i18n.t('charts.tableScrollable.truncatedRows', {
          shown: themeFormatter.number(rowsToDisplay.length),
          total: themeFormatter.number(totalRows),
        })
      : undefined;

  return (
    <ChartCard
      ref={cardContentRef}
      data={{
        isLoading,
        data: rowsToDisplay,
      }}
      dimensionsAndMeasures={dimensionsAndMeasures}
      errorMessage={results?.error}
      onCustomDownload={handleCustomDownload}
      {...asChartCardHeaderProps(props)}
    >
      <TableScrollable
        ref={tableRef}
        hasMoreData={hasMoreData}
        onRowIndexClick={handleRowIndexClick}
        headers={headers}
        rows={getTableRows({ rows: rowsToDisplay, clickDimension })}
        showIndex={showIndex}
        sort={state?.sort}
        isLoading={isLoadingTable}
        loadingLabel={i18n.t('common.loading')}
        onNextPage={handleNextPage}
        onSortChange={handleSortChange}
      />
      {truncatedRowsLabel && <div className={styles.truncatedRows}>{truncatedRowsLabel}</div>}
    </ChartCard>
  );
};

export default TableScrollablePro;
