<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { HOST } from '@/utils/api';

const { t } = useI18n();
const mainStore = useMainStore();

const greeting = t('neko.greeting');

const messages = ref<{ role: string; content: string }[]>([
  { role: 'assistant', content: greeting },
]);
const input = ref('');
const loading = ref(false);
const chatRef = ref<HTMLElement | null>(null);

async function send() {
  const text = input.value.trim();
  if (!text || loading.value) return;
  input.value = '';
  messages.value.push({ role: 'user', content: text });
  while (messages.value.length >= 6) {
    messages.value.shift();
  }
  loading.value = true;
  messages.value.push({ role: 'assistant', content: '' });
  try {
    const res = await fetch(`${HOST}/neko/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.slice(0, -1),
        jwt: mainStore.jwt,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      messages.value[messages.value.length - 1]!.content = err.error || 'Request failed';
      if (res.status === 401) {
        mainStore.jwt = '';
      }
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        const lines = block.split('\n');
        let eventType = '';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }
        if (eventType === 'message' && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              const last = messages.value[messages.value.length - 1];
              if (last) last.content += parsed.content;
            }
          } catch {}
        } else if (eventType === 'error' && dataStr) {
          const last = messages.value[messages.value.length - 1];
          if (last) last.content = dataStr;
        }
      }
    }
  } catch (err: any) {
    const last = messages.value[messages.value.length - 1];
    if (last && last.role === 'assistant' && !last.content) {
      last.content = `Error: ${err.message}`;
    } else {
      messages.value.push({ role: 'assistant', content: `Error: ${err.message}` });
    }
  } finally {
    loading.value = false;
  }
}

watch(
  messages,
  () => {
    nextTick(() => {
      if (chatRef.value) {
        chatRef.value.scrollTop = chatRef.value.scrollHeight;
      }
    });
  },
  { deep: true },
);
</script>

<template>
  <div class="relative h-full flex flex-col gap-4 p-4 overflow-hidden">
    <div ref="chatRef" class="overflow-y-auto flex flex-col flex-1 gap-2 px-1">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end text-right' : 'justify-start text-left'">
        <var-card class="max-w-[80%] w-fit">
          <div class="whitespace-pre-wrap">
            {{ msg.content }}
          </div>
        </var-card>
      </div>
    </div>
    <KTurnstile v-if="!mainStore.jwt" />
    <div v-else class="flex flex-col gap-2">
      <VarInput
        v-model="input"
        maxlength="50"
        :placeholder="$t('neko.placeholder')"
        @keyup.enter="send"
        :disabled="loading"
        class="flex-1" />
      <VarButton @click="send" :disabled="loading || !input.trim().length" type="primary" block>
        {{ $t('neko.meow') }}
      </VarButton>
    </div>
  </div>
</template>
