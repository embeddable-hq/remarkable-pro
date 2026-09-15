export const resolveReverseTrendDirection = (
  reverseTrendDirection: boolean | undefined,
  reversePositiveNegativeColors: boolean | undefined,
): boolean => reverseTrendDirection ?? reversePositiveNegativeColors ?? false;
