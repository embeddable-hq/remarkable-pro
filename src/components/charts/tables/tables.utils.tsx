import { DataResponse, Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import {
  CssSize,
  getStyleNumber,
  Markdown,
  TableBodyCellWithCopy,
  TableHeaderAlign,
  TableHeaderItem,
  TableHeaderItemAlign,
} from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { Theme } from '../../../theme/theme.types';
import { DisplayFormatTypeOptions } from '../../types/DisplayFormat.type.emb';
import styles from './tables.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getTableCellAlign = (dimOrMeas: DimensionOrMeasure): TableHeaderItemAlign => {
  const subInputAlign = dimOrMeas.inputs?.align;

  if (subInputAlign) return subInputAlign;

  // Get width by native type
  switch (dimOrMeas.nativeType) {
    case 'boolean':
    case 'time':
    case 'number':
      return TableHeaderAlign.RIGHT;
    default:
      return TableHeaderAlign.LEFT;
  }
};

export const getTableHeadAlign = (dimOrMeas: DimensionOrMeasure): TableHeaderItemAlign =>
  dimOrMeas.inputs?.headerAlign ?? getTableCellAlign(dimOrMeas);

export const getTableHeaderMinWidth = (dimOrMeas: DimensionOrMeasure): CssSize => {
  const subInputWidth = dimOrMeas.inputs?.width;

  if (subInputWidth) return subInputWidth;

  // Get width by native type
  switch (dimOrMeas.nativeType) {
    case 'string':
      return getStyleNumber('--em-tablechart-min-width--string' as any, '8.75rem') as number;
    case 'number':
      return getStyleNumber('--em-tablechart-min-width--number' as any, '5.625rem') as number;
    case 'time':
      return getStyleNumber('--em-tablechart-min-width--time' as any, '8.75rem') as number;
    case 'boolean':
    default:
      return getStyleNumber('--em-tablechart-min-width--boolean' as any, '5.625rem') as number;
  }
};

export const getTableHeaders = (
  props: {
    dimensionsAndMeasures: DimensionOrMeasure[];
    displayNullAs?: string;
  },
  theme: Theme,
): TableHeaderItem<any>[] => {
  const themeFormatter = getThemeFormatter(theme);
  return props.dimensionsAndMeasures.map((dimOrMeas) => {
    const dataCellAlign = getTableCellAlign(dimOrMeas);
    const displayFormat: string = dimOrMeas.inputs?.displayFormat;
    const hasCustomCellFormatter =
      displayFormat &&
      (displayFormat === DisplayFormatTypeOptions.JSON ||
        displayFormat === DisplayFormatTypeOptions.MARKDOWN);

    return {
      id: dimOrMeas.name,
      title: themeFormatter.dimensionOrMeasureTitle(dimOrMeas),
      minWidth: getTableHeaderMinWidth(dimOrMeas),
      align: dataCellAlign,
      headerAlign: getTableHeadAlign(dimOrMeas),
      accessor: (row) => {
        const updatedDimOrMeas = {
          ...dimOrMeas,
          inputs: { ...dimOrMeas.inputs, displayNullAs: props.displayNullAs },
        };
        return themeFormatter.data(updatedDimOrMeas, row[dimOrMeas.name]);
      },
      cellStyle: (value) => {
        const tableCellStyle = dimOrMeas.inputs?.tableCellStyle;
        if (tableCellStyle) {
          const activeTableCellStyle = theme.defaults.tableCellStyleOptions?.find(
            (style) => style.value === tableCellStyle,
          );
          if (activeTableCellStyle) {
            return activeTableCellStyle.styles(value);
          }
        }
        return undefined;
      },
      cell: hasCustomCellFormatter
        ? ({ value }) => {
            let currentValue: string | undefined;
            if (typeof value === 'string') {
              currentValue = value;
            } else if (value !== undefined && value !== null) {
              currentValue = String(value);
            } else {
              currentValue = undefined;
            }

            return (
              <TableBodyCellWithCopy align={dataCellAlign} value={value}>
                {displayFormat === DisplayFormatTypeOptions.MARKDOWN ? (
                  // Markdown
                  <span className={styles.markdownCell}>
                    <Markdown content={currentValue} />
                  </span>
                ) : (
                  // JSON
                  <pre>{currentValue}</pre>
                )}
              </TableBodyCellWithCopy>
            );
          }
        : undefined,
    };
  });
};

export const getTableRows = (props: { clickDimension?: Dimension; rows: DataResponse['data'] }) => {
  if (!props.rows || props.rows.length === 0) {
    return [];
  }

  const clickDimensionName = props.clickDimension?.name;

  if (!clickDimensionName || props.rows.some((row) => clickDimensionName in row)) {
    return props.rows;
  }

  return props.rows.map(({ [clickDimensionName]: _, ...row }) => ({
    ...row,
  }));
};
