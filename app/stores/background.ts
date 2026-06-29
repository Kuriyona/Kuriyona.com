type backgroundType = 'video' | 'image' | 'bing';

export const useBackgroundStore = defineStore('background', () => {
  const { t } = useI18n();

  const BackgroundPresets = computed(() => {
    return [
      {
        type: 'video',
        name: t('background.name.columbina'),
        url: 'https://r2.kuriyona.com/img/Background/Columbina.mp4',
        brightness: 0.1,
      },
      {
        type: 'image',
        name: t('background.name.loli-api'),
        random: true,
        url: 'https://www.loliapi.com/acg/',
        brightness: 0.1,
      },
      {
        type: 'bing',
        name: t('background.name.bing'),
        brightness: 0.1,
      },
    ];
  });

  const preset = ref(BackgroundPresets.value[0]!);

  const backgroundFileType = computed(() => (preset.value.type != 'video' ? 'image' : 'video'));
  const backgroundFileUrl = computed(() => {
    if (preset.value.type != 'bing') {
      console.log(preset.value.random);
      return preset.value.random ? `${preset.value.url}?timestamp=${Date.now()}` : preset.value.url;
    } else {
      return 'https://bing.img.run/1920x1080.php';
    }
  });

  return { BackgroundPresets, preset, backgroundFileType, backgroundFileUrl };
});
