import dayjs from 'dayjs';

export const startOfWeek = (date: dayjs.Dayjs, weekStartsOn = 1): dayjs.Dayjs =>
  date.subtract((date.day() - weekStartsOn + 7) % 7, 'day').startOf('day');
