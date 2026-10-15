/** `GET /api/music/playlist`：`coverUrl` 已是 https 的 96×96 缩略图，`duration` 为毫秒 */
export interface MusicTrack {
  id: number;
  name: string;
  artists: string[];
  coverUrl: string;
  duration: number;
}

export interface MusicPlaylist {
  tracks: MusicTrack[];
}

/** `GET /api/music/lyric?id=`：`time` 为毫秒（与 `MusicTrack.duration` 同单位，可直接和播放位置比较） */
export interface MusicLyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface MusicLyric {
  lines: MusicLyricLine[];
}
