<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <KCard :title="$t('about.info')">
    <KTable>
      <tbody class="bg-transparent">
        <tr>
          <th>{{ $t('about.name') }}</th>
          <td>未晞</td>
        </tr>
        <tr>
          <th>{{ $t('about.birth') }}</th>
          <td>{{ config.info.birth }}</td>
        </tr>
        <tr>
          <th>MBTI</th>
          <td>{{ config.info.mbti }}</td>
        </tr>
        <tr>
          <th>{{ $t('about.height') }}</th>
          <td>{{ config.info.height }} cm</td>
        </tr>
      </tbody>
    </KTable>
  </KCard>
</template>
