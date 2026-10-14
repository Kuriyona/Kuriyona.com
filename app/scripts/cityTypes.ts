export interface Cities {
  /** 常住城市：地图 + 实时天气（天气按它的 adcode 查） */
  resident: City;
  /** 当前所在城市：只有地图 */
  current: City;
}

/** 首页城市卡片的数据形状：`map` 是 R2 公开地址（见 backend/docs/city-map.md） */
export interface City {
  name: string;
  adcode: string;
  map: string;
  weather?: Weather;
}

export interface Weather {
  code: string;
  updateTime: string;
  fxLink: string;
  now: Now;
  refer: Refer;
}

interface Now {
  obsTime: string;
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  wind360: string;
  windDir: string;
  windScale: string;
  windSpeed: string;
  humidity: string;
  precip: string;
  pressure: string;
  vis: string;
  cloud: string;
  dew: string;
}

interface Refer {
  sources: string[];
  license: string[];
}
