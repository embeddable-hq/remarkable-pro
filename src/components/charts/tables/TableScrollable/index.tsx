import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
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
import { TableScrollable, TableScrollableHandle, TableSort } from '@embeddable.com/remarkable-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTableHeaders, getTableRows } from '../tables.utils';
import { ChartCardMenuOptionOnClickProps } from '../../../../theme/defaults/defaults.ChartCardMenu.constants';
import { TABLE_SCROLLABLE_SIZE } from './TableScrollable.utils';
import { deepEqual } from 'fast-equals';

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
  const [rowsToDisplay, setRowsToDisplay] = useState<any[]>([]);

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
    setState?.((prevState) => ({
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
    const row = rowsToDisplay[rowIndex];

    let dimensionValue = clickDimension ? row?.[clickDimension.name] : undefined;
    const dimensionTimeRange = clickDimension
      ? getTimeRangeFromDimensionValue({
          value: dimensionValue ?? undefined,
          dimension: clickDimension,
        })
      : undefined;

    if (dimensionTimeRange) {
      dimensionValue = undefined;
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
      dimensionValue,
      dimensionTimeRange,
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
    if (results.isLoading) return;
    handleUpdateEmbeddableState({ page: (state?.page ?? 0) + 1 });
  };

  const handleSortChange = (newSort: TableSort<any> | undefined) => {
    firstLoadPending.current = true;
    handleUpdateEmbeddableState({ sort: newSort as TableScrollableProState['sort'], page: 0 });
  };

  const hasMoreData = results?.data && results.data.length === TABLE_SCROLLABLE_SIZE;
  const isLoading = Boolean(results?.isLoading || allResults?.isLoading);
  const isLoadingTable = results?.isLoading && !firstLoadPending.current;

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
    </ChartCard>
  );
};

export default TableScrollablePro;
