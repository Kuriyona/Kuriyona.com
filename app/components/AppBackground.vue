<script setup lang="ts">
const Background = 'https://r2.kuriyona.com/img/Background/Columbina.mp4';
</script>

<template>
  <div class="fixed w-full h-full top-0 left-0 z-[-1] brightness-5 select-none">
    <video
      class="w-full h-full object-cover object-[27%]"
      :src="Background"
      autoplay
      muted
      loop
      playsinline></video>
  </div>
</template>
