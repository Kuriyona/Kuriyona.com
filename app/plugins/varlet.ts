import { Input, Select, StyleProvider, Themes } from '@varlet/ui';
import '@varlet/touch-emulator';

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    StyleProvider(Themes.md3Dark);
    Input.setPropsDefaults({
      variant: 'outlined',
    });
    Select.setPropsDefaults({
      variant: 'outlined',
    });
  }
});
