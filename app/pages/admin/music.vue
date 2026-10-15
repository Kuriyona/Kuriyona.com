<script setup lang="ts">
definePageMeta({ layout: 'admin' });

type Target = 'playlist' | 'lyric';

const busy = ref<Target | null>(null);

const refresh = async (target: Target) => {
  if (busy.value) return;
  busy.value = target;
  try {
    const res = await fetchApi
      .post('/music/cache/purge', { json: { target } })
      .json<{ deleted: number }>();
    toast.success(
      target === 'playlist'
        ? '歌单缓存已清除，下次打开页面向上游重新拉取'
        : `已清除 ${res.deleted} 首曲目的歌词缓存`,
    );
  } catch (e) {
    toast.error(await adminErrorMessage(e));
  } finally {
    busy.value = null;
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <KCard title="立即刷新歌单缓存">
      <div class="flex flex-col gap-4">
        <p class="text-xs text-(--color-text-3)">
          删除 KV 键 <code>cache:music:playlist:18488781852</code>。歌单在
          <code>GET /api/music/playlist</code> 命中的是这份缓存（TTL 6
          小时），删掉之后下一次请求会重新问上游，改动「JW」歌单后不必等 6 小时。
        </p>
        <div class="flex justify-end">
          <KButton
            class="px-3! py-2! disabled:opacity-50"
            :disabled="busy !== null"
            @click="refresh('playlist')">
            {{ busy === 'playlist' ? '刷新中…' : '立即刷新' }}
          </KButton>
        </div>
      </div>
    </KCard>

    <KCard title="立即刷新所有歌曲歌词缓存">
      <div class="flex flex-col gap-4">
        <p class="text-xs text-(--color-text-3)">
          删除全部 <code>cache:music:lyric:*</code> 键（KV
          无批量删除，按前缀分页列出后逐个删）。歌词是<b>永久缓存</b>，上游改了歌词、或修好解析问题后，只有清掉才能拿到新内容；清除后每首歌在下次播放时各自重新取一次。
        </p>
        <div class="flex justify-end">
          <KButton
            class="px-3! py-2! disabled:opacity-50"
            :disabled="busy !== null"
            @click="refresh('lyric')">
            {{ busy === 'lyric' ? '刷新中…' : '立即刷新' }}
          </KButton>
        </div>
      </div>
    </KCard>

    <KCard title="注意">
      <ul class="flex list-disc flex-col gap-2 pl-5 text-xs text-(--color-text-3)">
        <li>
          这里只清 <b>Worker 侧 KV</b>。浏览器与 Cloudflare 边缘上已缓存的响应要另外处理：歌单响应
          <code>max-age=3600</code>，歌词响应 <code>max-age=31536000, immutable</code>。
        </li>
        <li>
          清边缘缓存用「缓存清除」页：歌单是
          <code>https://kuriyona.com/api/music/playlist</code>，歌词前缀是
          <code>kuriyona.com/api/music/lyric</code>。浏览器里的那份只能等过期或强刷。
        </li>
        <li>刷新只是让<b>下次请求</b>重新取；已经在播的页面不会自动更新，需要重新打开或切歌。</li>
      </ul>
    </KCard>
  </div>
</template>
