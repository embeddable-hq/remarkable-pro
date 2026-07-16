import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import {
  getStyle,
  HeatMap,
  HeatMapPropsDimension,
  HeatMapPropsMeasure,
} from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { useGetTableSortedResults } from '../tables.hooks';
import { useCallback } from 'react';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../../../utils/events.utils';
import { HeatMapCellClickArg, HeatMapProOptionsClickArg } from './HeatMapPro.types';

export type HeatMapProProps = {
  columnDimension: Dimension;
  columnWidth?: number;

  displayNullAs?: string;
  firstColumnWidth?: number;
  maxColor?: string;
  maxThreshold?: string;
  measure: Measure;
  midColor?: string;
  minColor?: string;
  minThreshold?: string;
  results: DataResponse;
  rowDimension: Dimension;
  showValues?: boolean;
  onCellClicked?: (args: HeatMapProOptionsClickArg) => void;
  componentName?: string;
  trackingId?: string;
} & ChartCardHeaderProps;

export const getHeatMeasure = (
  props: { measure: Measure },
  theme: Theme,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): HeatMapPropsMeasure<any> => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.measure.name,
    label: themeFormatter.dimensionOrMeasureTitle(props.measure),
    format: (value) => {
      return themeFormatter.data(props.measure, value);
    },
  };
};

export const getHeatDimension = (
  props: { dimension: Dimension },
  theme: Theme,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): HeatMapPropsDimension<any> => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.dimension.name,
    label: themeFormatter.dimensionOrMeasureTitle(props.dimension),
    format: (value: string) => themeFormatter.data(props.dimension, value),
  };
};

const HeatMapPro = (props: HeatMapProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    measure,
    rowDimension,
    columnDimension,
    maxColor,
    midColor,
    minColor,
    displayNullAs,
    columnWidth,
    firstColumnWidth,
    showValues,
    minThreshold,
    maxThreshold,
    componentName,
    trackingId,
    onCellClicked,
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
    measures: [measure],
  });

  const pivotMeasures = getHeatMeasure({ measure }, theme);
  const pivotRowDimension = getHeatDimension({ dimension: rowDimension }, theme);
  const pivotColumnDimension = getHeatDimension({ dimension: columnDimension }, theme);

  const handleCellClick = useCallback(
    ({
      rowDimensionValue: rawRowDimensionValue,
      columnDimensionValue: rawColumnDimensionValue,
    }: HeatMapCellClickArg) => {
      let rowDimensionValue: string | undefined = rawRowDimensionValue;
      let columnDimensionValue: string | undefined = rawColumnDimensionValue;

      const rowDimensionTimeRange = getTimeRangeFromDimensionValue({
        value: rowDimensionValue,
        dimension: rowDimension,
      });
      const columnDimensionTimeRange = getTimeRangeFromDimensionValue({
        value: columnDimensionValue,
        dimension: columnDimension,
      });

      const measureValue = results.find(
        (row) =>
          row[rowDimension.name] === rawRowDimensionValue &&
          row[columnDimension.name] === rawColumnDimensionValue,
      )?.[measure.name];

      if (rowDimensionTimeRange) {
        rowDimensionValue = undefined;
      }
      if (columnDimensionTimeRange) {
        columnDimensionValue = undefined;
      }

      dispatchEventUserInteraction({
        componentName,
        trackingId,
        rowDimension,
        columnDimension,
        rowDimensionValue,
        rowDimensionTimeRange,
        columnDimensionValue,
        columnDimensionTimeRange,
        measure,
        measureValue,
      });

      if (!onCellClicked) return;
      onCellClicked({
        rowDimensionValue,
        rowDimensionTimeRange,
        columnDimensionValue,
        columnDimensionTimeRange,
      });
    },
    [onCellClicked, rowDimension, columnDimension, measure, results, componentName, trackingId],
  );

  return (
    <ChartCard
      data={props.results}
      dimensionsAndMeasures={[rowDimension, columnDimension, measure]}
      errorMessage={props.results?.error}
      {...asChartCardHeaderProps(props)}
    >
      <HeatMap
        data={results}
        measure={pivotMeasures}
        rowDimension={pivotRowDimension}
        columnDimension={pivotColumnDimension}
        maxColor={maxColor}
        midColor={midColor ?? getStyle('--em-tablechart-heatmap-color', '#FF5400')}
        minColor={minColor}
        showValues={showValues}
        minThreshold={minThreshold}
        maxThreshold={maxThreshold}
        columnWidth={columnWidth}
        firstColumnWidth={firstColumnWidth}
        displayNullAs={displayNullAs}
        onCellClick={handleCellClick}
      />
    </ChartCard>
  );
};

export default HeatMapPro;
