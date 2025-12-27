import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Varlet, {
  Card,
  Input,
  Menu,
  Select,
  StyleProvider,
  Themes
} from '@varlet/ui';

import App from './App.vue';

import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Varlet);

app.mount('#app');

import './styles/main.css';
import '@varlet/ui/es/style';

StyleProvider({
  ...Themes.md3Dark
});

Input.setPropsDefaults({
  variant: 'outlined'
});
Select.setPropsDefaults({
  variant: 'outlined'
});
