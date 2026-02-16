export const sortArrayByProp = <T, K extends keyof T>(
  arr: T[],
  prop: K,
  order: 'asc' | 'desc' = 'asc',
): T[] => {
  return [...arr].sort((a, b) => {
    if (a[prop] < b[prop]) return order === 'asc' ? -1 : 1;
    if (a[prop] > b[prop]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};
