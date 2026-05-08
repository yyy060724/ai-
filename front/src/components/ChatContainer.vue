<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createStreamChatCompletion } from '@/api/chat'
import ChatComposer from '@/components/ChatComposer.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage, ChatRequestMessage } from '@/types/chat'

const chatStore = useChatStore()
const isLoading = ref(false)
const messageListRef = ref<HTMLElement | null>(null)

const currentConversation = computed(() => chatStore.currentConversation)
const messages = computed(() => currentConversation.value?.messages ?? [])
const currentPreset = computed(
  () => chatStore.rolePresets.find((item) => item.id === currentConversation.value?.rolePresetId) ?? chatStore.rolePresets[0],
)

const scrollToBottom = async () => {
  await nextTick()

  if (messageListRef.value) {
    messageListRef.value.scrollTo({
      top: messageListRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

const buildApiMessages = (conversationMessages: ChatMessage[]): ChatRequestMessage[] => [
  {
    role: 'system',
    content: currentPreset.value.prompt,
  },
  ...conversationMessages
    .filter((item) => item.role !== 'assistant' || item.content.trim())
    .map((item) => ({
      role: item.role,
      content: item.content,
    })),
]

const parseStream = async (response: Response, assistantMessageId: string) => {
  const reader = response.body?.getReader()

  if (!reader) {
    throw new Error('流式读取失败。')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const lines = part
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      for (const line of lines) {
        if (!line.startsWith('data:')) {
          continue
        }

        const data = line.slice(5).trim()

        if (!data || data === '[DONE]') {
          continue
        }

        const parsed = JSON.parse(data)
        const chunk = parsed.choices?.[0]?.delta?.content ?? ''

        if (!chunk) {
          continue
        }

        fullText += chunk
        chatStore.updateMessage(assistantMessageId, (message) => {
          message.content = fullText
          message.status = 'streaming'
        })
        await scrollToBottom()
      }
    }
  }

  chatStore.updateMessage(assistantMessageId, (message) => {
    message.status = 'done'
  })
}

const sendMessage = async (content: string) => {
  if (isLoading.value) {
    return
  }

  const userMessage = chatStore.addMessage('user', content, 'done')

  if (!userMessage) {
    return
  }

  const assistantMessage = chatStore.addMessage('assistant', '', 'streaming')

  if (!assistantMessage) {
    return
  }

  isLoading.value = true
  await scrollToBottom()

  try {
    const requestMessages = buildApiMessages(messages.value.slice(1, -1))
    const response = await createStreamChatCompletion(requestMessages)
    await parseStream(response, assistantMessage.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    chatStore.updateMessage(assistantMessage.id, (item) => {
      item.content = `抱歉，这次请求失败了：${message}`
      item.status = 'error'
      item.errorMessage = message
    })
    ElMessage.error(message)
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const copyMessage = async (content: string) => {
  await navigator.clipboard.writeText(content)
  ElMessage.success('已复制到剪贴板')
}

const regenerateMessage = async () => {
  if (isLoading.value || !currentConversation.value) {
    return
  }

  const conversationMessages = [...currentConversation.value.messages]
  const lastAssistant = [...conversationMessages].reverse().find((item) => item.role === 'assistant')
  const lastUser = [...conversationMessages].reverse().find((item) => item.role === 'user')

  if (!lastAssistant || !lastUser) {
    return
  }

  chatStore.removeMessage(lastAssistant.id)
  await sendMessage(lastUser.content)
}

watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)
</script>

<template>
  <section class="chat-panel">
    <header class="chat-panel__header">
      <div>
        <p class="chat-panel__eyebrow">OpenAI Compatible API</p>
        <h2>{{ currentConversation?.title ?? '新对话' }}</h2>
      </div>

      <div class="chat-panel__hint">
        <strong>{{ currentPreset.name }}</strong>
        <span>{{ currentPreset.description }}</span>
      </div>
    </header>

    <main ref="messageListRef" class="chat-panel__messages">
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :can-regenerate="
          message.role === 'assistant' &&
          message.id === [...messages].reverse().find((item) => item.role === 'assistant')?.id
        "
        @copy="copyMessage"
        @regenerate="regenerateMessage"
      />
    </main>

    <ChatComposer :loading="isLoading" @submit="sendMessage" />
  </section>
</template>

<style scoped>
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px 18px;
  border-bottom: 1px solid var(--app-border);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
}

.chat-panel__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chat-panel__header h2 {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}

.chat-panel__hint {
  align-self: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
}

.chat-panel__hint span {
  color: #64748b;
  font-size: 13px;
}

.chat-panel__messages {
  flex: 1;
  padding: 26px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 960px) {
  .chat-panel__header {
    flex-direction: column;
  }

  .chat-panel__hint {
    align-self: stretch;
    min-width: 0;
  }

  .chat-panel__messages {
    padding: 18px 16px;
  }
}
</style>
