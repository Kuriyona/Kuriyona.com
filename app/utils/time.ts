import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/ja';

export const setLocale = (locale: string) => {
  dayjs.locale(
    {
      'zh-Hans': 'zh-cn',
      'zh-Hant': 'zh-tw',
      ja: 'ja',
      en: 'en',
    }[locale],
  );
};

export const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | number) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDuration = (duration: number) => {
  return dayjs.duration(duration).format('mm:ss');
};

export const formatRelativeTime = (time: string) => {
  return dayjs(time).fromNow();
};
