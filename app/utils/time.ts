import dayjs from 'dayjs';

export const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | number) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDuration = (duration: number) => {
  return dayjs.duration(duration).format('mm:ss');
};
