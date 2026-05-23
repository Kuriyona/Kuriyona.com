<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <KCard :title="$t('about.info')">
    <KTable>
      <tbody class="bg-transparent">
        <tr>
          <th>名字</th>
          <td>未晞</td>
        </tr>
        <tr>
          <th>生日</th>
          <td>{{ config.info.birth }}</td>
        </tr>
        <tr>
          <th>MBTI</th>
          <td>{{ config.info.mbti }}</td>
        </tr>
        <tr>
          <th>身高</th>
          <td>{{ config.info.height }} cm</td>
        </tr>
      </tbody>
    </KTable>
  </KCard>
</template>
