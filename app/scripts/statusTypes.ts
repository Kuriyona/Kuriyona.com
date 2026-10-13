export interface Status {
  weather: Weather;
  github_activity: GithubActivity;
  steam: Steam;
  cities: Cities;
}

/** 状态页地图：后端按城市出图写 R2，`ready` 为 false 时图还没生成好 */
export interface CityMap {
  name: string;
  adcode: string;
  map: string;
  ready: boolean;
}

export interface Cities {
  resident: CityMap;
  current: CityMap;
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

export interface GithubActivity {
  [repo: string]: string;
}

export interface Steam {
  personaName: string;
  personaState: number;
  realName: string;
  gameExtraInfo: string;
  gameId: string;
}
