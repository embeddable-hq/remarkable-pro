import { i18n } from '../theme/i18n/i18n';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveI18nString = (value: string, args?: Record<string, any>): string => {
  // Not a translation key, return the value as is
  if (!value?.includes('|')) return value;

  const [key, fallback] = value.split('|', 2).map((part) => part.trim());

  // i18n is not initialized, return the fallback or the key
  if (!i18n.isInitialized) {
    return (fallback ?? key) as string;
  }

  return i18n.t(
    [key, fallback].filter((v): v is string => !!v),
    args,
  );
};

export const resolveI18nProps = <T extends object>(props: T): T => {
  const resolved = {} as T;

  (Object.keys(props) as Array<keyof T>).forEach((key) => {
    const value = props[key];
    resolved[key] = (typeof value === 'string' ? resolveI18nString(value) : value) as T[keyof T];
  });

  return resolved;
};
