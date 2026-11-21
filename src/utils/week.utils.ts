import dayjs from 'dayjs';

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const startOfWeek = (date: dayjs.Dayjs, weekStartsOn: WeekStartsOn = 1): dayjs.Dayjs =>
  date.subtract((date.day() - weekStartsOn + 7) % 7, 'day').startOf('day');
