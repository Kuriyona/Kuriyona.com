import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Snackbar } from '@varlet/ui';
import { useI18n } from 'vue-i18n';

export const useApiStore = defineStore('api', () => {
  const { t } = useI18n();

  const APIHost = import.meta.env.DEV
    ? 'http://localhost:62801'
    : 'https://api.kuriyona.com';
  let APIKey = '';

  const isConnectedToServer = ref(false);
  function testConnection() {
    const snackbar = Snackbar.loading(t('meta.test-connection'));
    setTimeout(() => {
      snackbar.clear();
    }, 10000);
    return new Promise((resolve, reject) => {
      fetch(APIHost)
        .then((res) => {
          console.log(res);
          if (res.status === 200) {
            isConnectedToServer.value = true;
            Snackbar.success(t('meta.test-connection-success'));
            resolve(true);
          } else {
            isConnectedToServer.value = false;
            Snackbar.error(t('meta.test-connection-failed'));
            resolve(false);
          }
        })
        .catch((err) => {
          isConnectedToServer.value = false;
          Snackbar.error('服务器连接失败');
          resolve(false);
        });
      snackbar.clear();
    });
  }
  testConnection();

  async function fetchApi<T>(url: string, method: string = 'GET', body?: any) {
    const isFormData = body instanceof FormData;

    const res = await fetch(APIHost + url, {
      method: method,
      headers: {
        Authorization: `${APIKey}`
      },
      body: method !== 'GET' ? body : undefined
    });

    if (res.status === 401) {
      Snackbar.error('API Key 无效');
    }

    return {
      data: (await res.json()) as T,
      res
    };
  }

  function setApiKey(key: string) {
    APIKey = key;
  }

  return {
    isConnectedToServer,
    testConnection,
    fetchApi,
    setApiKey
  };
});

export const useMainStore = defineStore('main', () => {
  const isAdminMode = ref(false);

  return {
    isAdminMode
  };
});
