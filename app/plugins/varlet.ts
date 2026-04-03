import { Input, Select, StyleProvider, Themes } from '@varlet/ui';
import '@varlet/touch-emulator';

export default defineNuxtPlugin(() => {
  StyleProvider(Themes.md3Dark);
  Input.setPropsDefaults({
    variant: 'outlined'
  });
  Select.setPropsDefaults({
    variant: 'outlined'
  });
});
