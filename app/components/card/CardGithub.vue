<script setup lang="ts">
import type { GithubActivity } from '~/scripts/statusTypes';

const props = defineProps<{
  github_activity: GithubActivity;
}>();

const data = computed(() => {
  return Object.entries(props.github_activity);
});

const repoLink = (repo: string) => {
  return `https://github.com/${repo}`;
};
</script>

<template>
  <KCard title="GitHub" class="min-w-[25%]">
    <div class="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
      <div
        v-for="[repo, time] in data"
        :key="repo"
        class="flex max-[400px]:flex-col gap-2 justify-between">
        <p>
          <span>{{ $t('status.commit-to') }}</span>
          <a :href="repoLink(repo)" target="_blank" class="link">{{ repo }}</a>
        </p>
        <p class="flex-1 text-right">{{ formatRelativeTime(time) }}</p>
      </div>
    </div>
  </KCard>
</template>
