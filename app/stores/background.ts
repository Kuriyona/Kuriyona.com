export const BackgroundPresets = [
  {
    type: 'video',
    name: 'Columbina from Genshin Web Event',
    url: 'https://r2.kuriyona.com/img/Background/Columbina.mp4',
    brightness: 0.1,
  },
  {
    type: 'image',
    name: 'LoliAPI Random ACG Image',
    random: true,
    url: 'https://www.loliapi.com/acg/',
    brightness: 0.1,
  },
  {
    type: 'bing',
    name: 'Bing Daily Image',
    brightness: 0.1,
  },
];

type backgroundType = 'video' | 'image' | 'bing';

export const useBackgroundStore = defineStore('background', () => {
  const preset = ref(BackgroundPresets[0]!);

  const backgroundFileType = computed(() => (preset.value.type != 'video' ? 'image' : 'video'));
  const backgroundFileUrl = computed(() => {
    if (preset.value.type != 'bing') {
      console.log(preset.value.random);
      return preset.value.random ? `${preset.value.url}?timestamp=${Date.now()}` : preset.value.url;
    } else {
      return 'https://bing.img.run/1920x1080.php';
    }
  });

  return { preset, backgroundFileType, backgroundFileUrl };
});
