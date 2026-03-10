import { DimensionOrMeasure } from '@embeddable.com/core';
import { DateTimeFormatter, NumberFormatter, StringFormatter } from './formatter.types';
import { Theme } from '../theme.types';
import { cache } from '../../utils/cache.utils';
import { isValidISODate } from '../../utils/data.utils';
import { resolveI18nString } from '../../components/component.utils';
import { DisplayFormatTypeOptions } from '../../components/types/DisplayFormat.type.emb';

/* eslint-disable @typescript-eslint/no-explicit-any */

const formatOption = (key: DimensionOrMeasure, inputKey: string, metaKey?: string) =>
  key.inputs?.[inputKey] ?? (key.meta as any)?.[metaKey ?? inputKey];

export type GetThemeFormatter = {
  string: (key: string) => string;
  number: (value: number | bigint, options?: Intl.NumberFormatOptions) => string;
  dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) => string;
  dimensionOrMeasureTitle: (key: DimensionOrMeasure) => string;
  data: (key: DimensionOrMeasure, value: any) => string;
};

export const getThemeFormatter = (theme: Theme): GetThemeFormatter => {
  const cachedNumberFormatter = cache<Intl.NumberFormatOptions, NumberFormatter>((options) =>
    theme.formatter.numberFormatter(theme, options),
  );

  const cachedDataNumberFormatter = cache<DimensionOrMeasure, NumberFormatter>((key) =>
    theme.formatter.dataNumberFormatter(theme, key!),
  );

  const cachedDateTimeFormatter = cache<Intl.DateTimeFormatOptions, DateTimeFormatter>((options) =>
    theme.formatter.dateTimeFormatter(theme, options),
  );

  const cachedDataDateTimeFormatter = cache<DimensionOrMeasure, DateTimeFormatter>((key) =>
    theme.formatter.dataDateTimeFormatter(theme, key!),
  );

  const cachedDataOthersFormatter = cache<DimensionOrMeasure, StringFormatter>((key) =>
    theme.formatter.dataOthersFormatter(theme, key!),
  );

  return {
    string: (key: string) => theme.formatter.stringFormatter().format(key),
    number: (value: number | bigint, options?: Intl.NumberFormatOptions): string => {
      return cachedNumberFormatter(options).format(value);
    },
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions): string => {
      return cachedDateTimeFormatter(options).format(value);
    },
    dimensionOrMeasureTitle: (key: DimensionOrMeasure): string => {
      const displayName = formatOption(key, 'displayName');
      if (displayName) {
        if (displayName.includes('|')) {
          return resolveI18nString(displayName);
        }
        return displayName;
      }

      const resolved = cachedDataOthersFormatter(key).format(key.name);
      return resolved === key.name ? (key.title ?? key.name) : resolved;
    },
    data: (key: DimensionOrMeasure, value: any): string => {
      let newValue = value;

      // Nulls (inputs override meta)
      if (value == null) {
        return formatOption(key, 'displayNullAs') ?? '';
      }

      // JSON and Markdown (inputs override meta)
      const displayFormat = formatOption(key, 'displayFormat');
      if (displayFormat === DisplayFormatTypeOptions.JSON) {
        return JSON.stringify(value, null, 2);
      }
      if (displayFormat === DisplayFormatTypeOptions.MARKDOWN) {
        return value;
      }
      // Objects
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      // Number
      if (key.nativeType === 'number') {
        newValue = cachedDataNumberFormatter(key).format(value);
      }

      // Time
      if (key.nativeType === 'time' && isValidISODate(value)) {
        newValue = cachedDataDateTimeFormatter(key).format(new Date(value));
      }

      // Others (boolean and string)
      if (key.nativeType === 'boolean' || key.nativeType === 'string') {
        newValue = cachedDataOthersFormatter(key).format(value);
      }

      // Prefix and suffix (inputs override meta; meta uses pretext/posttext)
      const prefix = formatOption(key, 'prefix', 'pretext') || '';
      const suffix = formatOption(key, 'suffix', 'posttext') || '';
      const appended = `${prefix}${newValue}${suffix}`;

      // Max characters (inputs override meta)
      const maxCharacters = formatOption(key, 'maxCharacters');
      if (maxCharacters != null) {
        if (appended.length <= maxCharacters) {
          return appended;
        }
        return appended.substring(0, maxCharacters) + '...';
      }

      return appended;
    },
  };
};
