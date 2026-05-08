<script setup lang="ts">
const Background = 'https://r2.kuriyona.com/img/Background/Columbina.mp4';
</script>

<template>
  <div class="fixed w-full h-full z-[-1] brightness-15">
    <video
      class="w-full h-full object-cover object-[27%]"
      :src="Background"
      autoplay
      muted
      loop
      playsinline></video>
  </div>
</template>
