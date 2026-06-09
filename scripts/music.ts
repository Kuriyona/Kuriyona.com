import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import { getPlaylistDetail, getLyric, getSongsDetail } from '@kuriyona/cecilia';
import { upload } from '../server/utils';

const playlistIds = [18007101553, 8620310425];

const allSongs: { id: number; addTime: number }[] = [];

for (const playlistId of playlistIds) {
  const playlist = await getPlaylistDetail(playlistId);
  fs.writeFile(
    path.join(dirname, `../temp/playlist-${playlistId}.json`),
    JSON.stringify(playlist, null, 2),
  );
  upload(
    JSON.stringify(playlist, null, 2),
    `static/163-music/playlist/${playlistId}.json`,
  );
  console.log(`Playlist [${playlist.name}] (${playlistId}): ${playlist.songs.length} songs`);
  allSongs.push(...playlist.songs);
}

const uniqueSongIds = [...new Set(allSongs.map((s) => s.id))];
console.log(`Total unique songs: ${uniqueSongIds.length}`);

const details = await getSongsDetail(uniqueSongIds);
for (const detail of details) {
  const lyric = await getLyric(detail.id);
  const artist = detail.artists.map((a) => a.name).join(', ');
  console.log(`  ${detail.name} — ${artist} (${Math.round(detail.duration / 1000)}s)`);

  upload(
    JSON.stringify(detail, null, 2),
    `static/163-music/song-detail/${detail.id}.json`,
  );
  upload(
    JSON.stringify(lyric, null, 2),
    `static/163-music/lyric/${detail.id}.json`,
  );

  if (lyric.lines.length > 0) {
    const first = lyric.lines[0];
    console.log(`    Lyrics: ${first.text}${first.translation ? ` / ${first.translation}` : ''}`);
    const last = lyric.lines[lyric.lines.length - 1];
    console.log(`    ... ${last.text}${last.translation ? ` / ${last.translation}` : ''}`);
  } else {
    console.log('    (no lyrics)');
  }
}

console.log('Done — all playlists, song details, and lyrics uploaded.');
