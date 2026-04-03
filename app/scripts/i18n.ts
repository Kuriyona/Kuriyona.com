import { ref, watchEffect } from 'vue';

export enum Locales {
  en = 0,
  zh = 1
}

const setLanguage = (lang: string) => {
  if (lang === 'zh') {
    locale.value = Locales.zh;
  } else {
    locale.value = Locales.en;
  }
};

const locale = ref(0);
[navigator.language, ...navigator.languages].forEach((lang) => {
  if (lang.startsWith('zh')) {
    setLanguage('zh');
  }
});

const t = (translation: string[]) => {
  return translation[locale.value];
};

export function useI18n() {
  return { locale, setLanguage, t };
}
