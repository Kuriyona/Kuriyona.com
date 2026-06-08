<script setup lang="ts">
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const birthday = dayjs('2008/6/28');
const nextBirthday = birthday.year(dayjs().year());
if (nextBirthday.isBefore()) {
  nextBirthday.add(1, 'year');
}
const age = computed(() => nextBirthday.year() - birthday.year());
const closed = ref(false);

const now = useNow({
  interval: 1000,
});
const countdownDays = computed(() => {
  return dayjs.duration(nextBirthday.diff(now.value));
});
const show = computed(() => {
  return countdownDays.value.asDays() <= 30 && !closed.value;
});
const showTips = useLocalStorage('showNekoTips', true);
const showTips2 = useLocalStorage('showNekoTips2', true);
</script>

<template>
  <div v-if="show" class="flex items-center justify-between gap-2 text-sm text-white/80">
    <p>
      {{ $t('global.birthdayCountdown', [age, countdownDays.format('D [d] H [h] m [m] s [s]')]) }}
    </p>
    <KButton round text size="mini" @click="closed = true">
      <span class="material-symbols-outlined text-sm! leading-none"> close </span>
    </KButton>
  </div>
  <div v-if="showTips" class="flex items-center justify-between gap-2 text-sm text-white/80">
    <p>
      {{ $t('neko.tips') }}
    </p>
    <KButton round text size="mini" @click="showTips = false">
      <span class="material-symbols-outlined text-sm! leading-none"> close </span>
    </KButton>
  </div>
  <div v-if="showTips2" class="flex items-center justify-between gap-2 text-sm text-white/80">
    <p>网站纯自己手写|我知道自己写的丑喵|高考完会进行重制的喵|唔，就是这样</p>
    <KButton round text size="mini" @click="showTips2 = false">
      <span class="material-symbols-outlined text-sm! leading-none"> close </span>
    </KButton>
  </div>
</template>
