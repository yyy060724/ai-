<script setup lang="ts">
import { computed } from 'vue'
import { CopyDocument, RefreshRight } from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types/chat'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  message: ChatMessage
  canRegenerate?: boolean
}>()

const emit = defineEmits<{
  copy: [content: string]
  regenerate: []
}>()

const htmlContent = computed(() => renderMarkdown(props.message.content))
</script>

<template>
  <article class="message" :class="`message--${message.role}`">
    <div class="message__avatar">
      {{ message.role === 'user' ? '我' : 'AI' }}
    </div>

    <div class="message__body">
      <div v-if="message.status === 'streaming' && !message.content" class="message__typing">
        <span />
        <span />
        <span />
      </div>

      <div v-else class="message__content markdown-body" v-html="htmlContent" />

      <div class="message__meta">
        <span>{{ new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
        <el-button text :icon="CopyDocument" @click="emit('copy', message.content)">复制</el-button>
        <el-button v-if="canRegenerate" text :icon="RefreshRight" @click="emit('regenerate')">重试</el-button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.message {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.message--user .message__avatar {
  background: linear-gradient(135deg, #0f766e, #10b981);
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.28);
}

.message__body {
  max-width: min(100%, 820px);
  border: 1px solid var(--app-border);
  border-radius: 20px;
  padding: 16px 18px;
  background: #fff;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
}

.message--user .message__body {
  background: linear-gradient(135deg, #eff6ff, #eef2ff);
}

.message__content {
  color: #1f2937;
  line-height: 1.75;
}

.message__content :deep(p:first-child) {
  margin-top: 0;
}

.message__content :deep(p:last-child) {
  margin-bottom: 0;
}

.message__content :deep(pre) {
  margin: 12px 0;
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px;
  border-radius: 14px;
  overflow-x: auto;
}

.message__content :deep(code) {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
}

.message__content :deep(:not(pre) > code) {
  background: rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  padding: 2px 6px;
}

.message__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
}

.message__typing {
  display: inline-flex;
  gap: 6px;
  padding: 8px 0;
}

.message__typing span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #94a3b8;
  animation: pulse 1.2s infinite ease-in-out;
}

.message__typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.message__typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.9);
    opacity: 0.65;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
