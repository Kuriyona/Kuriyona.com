export type PlaylistDetails = {
  id: number;
  name: string;
  coverImgId: number;
  coverImgUrl: string;
  userId: number;
  createTime: number;
  songs: {
    id: number;
    addTime: number;
  }[];
};

export type SongDetail = {
  id: number;
  name: string;
  artists: {
    id: number;
    name: string;
  }[];
  album: {
    id: number;
    name: string;
    picUrl: string;
  };
  duration: number;
};

export interface Lyric {
  lines: LyricLine[];
}
export type LyricLine = {
  time: number;
  text: string;
  translation?: string;
};
