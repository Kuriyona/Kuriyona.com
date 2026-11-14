import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/ja';

/** 切换 dayjs 的 locale（名称上区别于 vue-i18n 的 `setLocale`，后者是自动导入的全局函数） */
export const setDayjsLocale = (locale: string) => {
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
