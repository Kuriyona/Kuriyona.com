export interface Status {
  weather: Weather;
  github_activity: GithubActivity;
  steam: Steam;
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
