import ColorType from '../editors/ColorEditor/Color.type.emb';
import AlignType from './types/Align.type.emb';
import DisplayFormatType from './types/DisplayFormat.type.emb';
import TableCellStyleType from './types/TableCellStyle.type.emb';

/* -------------------- */
/* ----- Generics ----- */
/* -------------------- */

const number = {
  name: 'number',
  type: 'number',
  label: 'Number',
} as const;

const string = {
  name: 'string',
  type: 'string',
  label: 'String',
} as const;

const boolean = {
  name: 'boolean',
  type: 'boolean',
  label: 'Boolean',
} as const;

const timeRange = {
  name: 'timeRange',
  type: 'timeRange',
  label: 'Time range',
} as const;

/* ------------------ */
/* ----- Common ----- */
/* ------------------ */

const width = {
  name: 'width',
  type: 'number',
  label: 'Width',
  description: 'You can input a number in pixels e.g. 400',
} as const;

const align = { name: 'align', type: AlignType, label: 'Align' } as const;

const prefix = { name: 'prefix', type: 'string', label: 'Prefix' } as const;

const suffix = { name: 'suffix', type: 'string', label: 'Suffix' } as const;

const displayName = {
  name: 'displayName',
  type: 'string',
  label: 'Display name',
} as const;

const maxCharacters = {
  name: 'maxCharacters',
  type: 'number',
  label: 'Maximum characters',
  description: undefined,
  supportedTypes: ['string'],
} as const;

const decimalPlaces = {
  name: 'decimalPlaces',
  type: 'number',
  label: 'Decimal places',
  supportedTypes: ['number'],
} as const;

const currency = {
  name: 'currency',
  type: 'string',
  label: 'Currency',
  description: 'e.g. EUR',
  supportedTypes: ['number'],
} as const;

const abbreviateLargeNumber = {
  name: 'abbreviateLargeNumber',
  type: 'boolean',
  label: 'Abbreviate large number',
  supportedTypes: ['number'],
} as const;

const dateBounds = {
  name: 'dateBounds',
  type: 'timeRange',
  label: 'Date bounds',
  description: 'Set the date range for the axis',
  supportedTypes: ['time'],
} as const;

const granularity = {
  name: 'granularity',
  type: 'granularity',
  label: 'Granularity',
  supportedTypes: ['time'],
} as const;

const color = {
  type: ColorType,
  name: 'color',
  label: 'Color',
} as const;

const displayFormat = {
  type: DisplayFormatType,
  name: 'displayFormat',
  label: 'Display format',
} as const;

const tableCellStyle = {
  type: TableCellStyleType,
  name: 'tableCellStyle',
  label: 'Table cell style',
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dimensionMeasureSubInputs: any[] = [
  prefix,
  suffix,
  displayName,
  maxCharacters,
  decimalPlaces,
  currency,
  abbreviateLargeNumber,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const timeDimensionSubInputs: any[] = [
  prefix,
  suffix,
  displayName,
  maxCharacters,
  decimalPlaces,
  currency,
  abbreviateLargeNumber,
  granularity,
  dateBounds,
];

export const subInputs = {
  boolean,
  timeRange,
  number,
  string,
  width,
  align,
  prefix,
  suffix,
  displayName,
  maxCharacters,
  decimalPlaces,
  currency,
  abbreviateLargeNumber,
  dateBounds,
  granularity,
  color,
  displayFormat,
  tableCellStyle,
};
