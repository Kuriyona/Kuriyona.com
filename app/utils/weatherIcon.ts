/**
 * QWeather 天气图标码 → Material Symbols 图标名。
 *
 * 码表：weather-conditions.csv
 * https://github.com/qwd/dev-site/blob/master/assets/table/weather-conditions.csv
 * 另含 QWeather 图标表里 CSV 未列出的组：夜间（150~153 / 350 / 351 / 456 / 457）与风力（200~213）。
 * Material Symbols 没有沙尘类图标，扬沙/浮尘/沙尘暴借用 `grain`；未收录的码回退 999（未知）。
 */
const WEATHER_ICONS: Record<string, string> = {
  // 晴 / 云（100~104 白天，150~153 夜间）
  '100': 'material-symbols:sunny',
  '101': 'material-symbols:cloud',
  '102': 'material-symbols:partly-cloudy-day',
  '103': 'material-symbols:partly-cloudy-day',
  '104': 'material-symbols:cloudy',
  '150': 'material-symbols:clear-night',
  '151': 'material-symbols:partly-cloudy-night',
  '152': 'material-symbols:partly-cloudy-night',
  '153': 'material-symbols:partly-cloudy-night',

  // 风（200~213）
  '200': 'material-symbols:air',
  '201': 'material-symbols:air',
  '202': 'material-symbols:air',
  '203': 'material-symbols:air',
  '204': 'material-symbols:air',
  '205': 'material-symbols:air',
  '206': 'material-symbols:air',
  '207': 'material-symbols:air',
  '208': 'material-symbols:cyclone',
  '209': 'material-symbols:air',
  '210': 'material-symbols:cyclone',
  '211': 'material-symbols:tornado',
  '212': 'material-symbols:cyclone',
  '213': 'material-symbols:storm',

  // 雨（300~318 / 399，350 / 351 为夜间阵雨）
  '300': 'material-symbols:rainy',
  '301': 'material-symbols:rainy-heavy',
  '302': 'material-symbols:thunderstorm',
  '303': 'material-symbols:thunderstorm',
  '304': 'material-symbols:weather-hail',
  '305': 'material-symbols:rainy-light',
  '306': 'material-symbols:rainy',
  '307': 'material-symbols:rainy-heavy',
  '308': 'material-symbols:rainy-heavy',
  '309': 'material-symbols:rainy-light',
  '310': 'material-symbols:rainy-heavy',
  '311': 'material-symbols:rainy-heavy',
  '312': 'material-symbols:rainy-heavy',
  '313': 'material-symbols:weather-mix',
  '314': 'material-symbols:rainy-light',
  '315': 'material-symbols:rainy',
  '316': 'material-symbols:rainy-heavy',
  '317': 'material-symbols:rainy-heavy',
  '318': 'material-symbols:rainy-heavy',
  '350': 'material-symbols:rainy',
  '351': 'material-symbols:rainy-heavy',
  '399': 'material-symbols:rainy',

  // 雪（400~410 / 499，456 / 457 为夜间阵雪）
  '400': 'material-symbols:snowing',
  '401': 'material-symbols:snowing',
  '402': 'material-symbols:snowing-heavy',
  '403': 'material-symbols:snowing-heavy',
  '404': 'material-symbols:rainy-snow',
  '405': 'material-symbols:rainy-snow',
  '406': 'material-symbols:rainy-snow',
  '407': 'material-symbols:cloudy-snowing',
  '408': 'material-symbols:snowing',
  '409': 'material-symbols:snowing-heavy',
  '410': 'material-symbols:snowing-heavy',
  '456': 'material-symbols:rainy-snow',
  '457': 'material-symbols:cloudy-snowing',
  '499': 'material-symbols:snowing',

  // 雾 / 霾 / 沙尘（500~515）
  '500': 'material-symbols:foggy',
  '501': 'material-symbols:foggy',
  '502': 'material-symbols:mist',
  '503': 'material-symbols:grain',
  '504': 'material-symbols:grain',
  '507': 'material-symbols:grain',
  '508': 'material-symbols:grain',
  '509': 'material-symbols:foggy',
  '510': 'material-symbols:foggy',
  '511': 'material-symbols:mist',
  '512': 'material-symbols:mist',
  '513': 'material-symbols:mist',
  '514': 'material-symbols:foggy',
  '515': 'material-symbols:foggy',

  // 热 / 冷 / 未知
  '900': 'material-symbols:local-fire-department',
  '901': 'material-symbols:severe-cold',
  '999': 'material-symbols:help',
};

/** QWeather 图标码 → Material Symbols 全名；码缺失或未收录时回退「未知」 */
export const weatherIcon = (code?: string): string =>
  WEATHER_ICONS[code ?? ''] ?? 'material-symbols:help';
