export const getClientContextTimezone = (tz?: string): string | undefined => {
  if (!tz) return undefined;

  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone').includes(tz) ? tz : undefined;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
};
