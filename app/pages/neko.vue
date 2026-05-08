<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { HOST } from '@/utils/api';

const greeting = '你好喵！我是未晞酱的小猫，有什么想聊的吗？';

const messages = ref<{ role: string; content: string }[]>([
  { role: 'assistant', content: greeting },
]);
const input = ref('');
const loading = ref(false);
const showChat = ref(true);
const chatRef = ref<HTMLElement | null>(null);

async function send() {
  const text = input.value.trim();
  if (!text || loading.value) return;
  input.value = '';
  messages.value.push({ role: 'user', content: text });
  loading.value = true;
  messages.value.push({ role: 'assistant', content: '' });
  try {
    const res = await fetch(`${HOST}/neko/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.slice(0, -1),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      messages.value[messages.value.length - 1]!.content = err.error || 'Request failed';
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
  <div class="flex justify-center h-full">
    <div class="w-160 my-20 p-4 flex flex-col gap-4">
      <div ref="chatRef" class="flex-1 overflow-y-auto">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="msg.role === 'user' ? 'text-right' : 'text-left'">
          <div
            :class="msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'"
            class="inline-block px-4 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap">
            {{ msg.content }}
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <VarInput
          v-model="input"
          placeholder="输入消息..."
          @keyup.enter="send"
          :disabled="loading"
          class="flex-1" />
        <VarButton @click="send" :loading="loading" type="primary" block>发送</VarButton>
      </div>
    </div>
  </div>
</template>
