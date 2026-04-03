<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';

const IPAddress = ref('');
const IPAddressLocation = ref('');

fetch('https://api.ipify.org?format=json')
  .then((res) => res.json())
  .then((data) => {
    IPAddress.value = data.ip;
    fetch(`http://ip-api.com/json/${IPAddress.value}`)
      .then((res) => res.json())
      .then((data) => {
        IPAddressLocation.value = `${data.city}, ${data.regionName}, ${data.country}`;
      });
  });

const data: Ref<any> = computed(() => {
  return {
    Error: 'ERROR 404 : NOT FOUND',
    Path: window.location,
    Time: new Date().toLocaleString(),
    UserAgent: navigator.userAgent,
    Language: navigator.languages.join(' | '),
    IPAddress: IPAddress.value,
    IPAddressLocation: IPAddressLocation.value,
    BuildTime: new Date(__BUILD_TIME__).toLocaleString()
  };
});

const message = computed(() => {
  let message = '';
  for (let key in data.value) {
    message += `<b>${key}</b> : ${data.value[key]}\n\n`;
  }
  return message;
});
</script>

<template>
  <div class="flex justify-center">
    <div class="w-100 py-20">
      <h2>{{ data.Error }}</h2>
      <br />
      <hr />
      <br />
      <pre v-html="message" style="text-wrap: auto"></pre>
    </div>
  </div>
</template>
