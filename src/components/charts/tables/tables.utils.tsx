import { DataResponse, Dimension, DimensionOrMeasure } from '@embeddable.com/core';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { CssSize, TableBodyCellWithCopy } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import {
  getStyleNumber,
  TableHeaderAlign,
  TableHeaderItem,
  TableHeaderItemAlign,
} from '@embeddable.com/remarkable-ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DisplayFormatTypeOptions } from '../../types/DisplayFormat.type.emb';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getTableHeaderAlign = (dimOrMeas: DimensionOrMeasure): TableHeaderItemAlign => {
  const subInputAlign = dimOrMeas.inputs?.align;

  if (subInputAlign) return subInputAlign;

  // Get width by native type
  switch (dimOrMeas.nativeType) {
    case 'boolean':
    case 'time':
      return TableHeaderAlign.RIGHT;
    default:
      return TableHeaderAlign.LEFT;
  }
};

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
    const displayFormat: string = dimOrMeas.inputs?.displayFormat;
    const hasCustomCellFormatter =
      displayFormat &&
      (displayFormat === DisplayFormatTypeOptions.JSON ||
        displayFormat === DisplayFormatTypeOptions.MARKDOWN);

    return {
      id: dimOrMeas.name,
      title: themeFormatter.dimensionOrMeasureTitle(dimOrMeas),
      minWidth: getTableHeaderMinWidth(dimOrMeas),
      align: getTableHeaderAlign(dimOrMeas),
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
            const currentValue: string | undefined =
              typeof value === 'string'
                ? value
                : value !== undefined && value !== null
                  ? String(value)
                  : undefined;

            return (
              <TableBodyCellWithCopy value={value}>
                {displayFormat === DisplayFormatTypeOptions.MARKDOWN ? (
                  // Markdown
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentValue}</ReactMarkdown>
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

  if (!clickDimensionName || Object.keys(props.rows[0]!).includes(clickDimensionName)) {
    return props.rows;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return props.rows.map(({ [clickDimensionName]: _, ...row }) => ({
    ...row,
  }));
};
