import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import { getPlaylistDetail, getLyric, getSongsDetail } from '@kuriyona/cecilia';
import { upload } from '../server/utils';

const playlistId = 18007101553;

const Playlist = await getPlaylistDetail(playlistId);
fs.writeFile(path.join(dirname, '../temp/playlist.json'), JSON.stringify(Playlist, null, 2));

const songs = Playlist.songs.map((song) => song.id);
const details = await getSongsDetail(songs);
details.forEach(async (detail) => {
  const lyric = await getLyric(detail.id);
  upload(JSON.stringify(lyric, null, 2), `static/163-music/lyric/${detail.id}.json`);
  upload(JSON.stringify(detail, null, 2), `static/163-music/song-detail/${detail.id}.json`);
});
upload(JSON.stringify(Playlist, null, 2), `static/163-music/playlist/${playlistId}.json`);
