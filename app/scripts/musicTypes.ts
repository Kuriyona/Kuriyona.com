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
