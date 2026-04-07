export const getClientContextTimezone = (tz?: string): string | undefined => {
  if (!tz) return undefined;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
};
