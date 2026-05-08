import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { fetchPersistedState, persistState } from '@/api/state'
import { ROLE_PRESETS } from '@/utils/constants'
import { loadChatState, saveChatState } from '@/utils/storage'
import { createId } from '@/utils/id'
import type { ChatMessage, Conversation, RolePreset } from '@/types/chat'

const createWelcomeMessage = (preset: RolePreset): ChatMessage => ({
  id: createId(),
  role: 'assistant',
  content: `你好，我是${preset.name}。${preset.description}\n\n你可以直接开始提问，我会结合当前角色设定来回答。`,
  createdAt: new Date().toISOString(),
  status: 'done',
})

const createConversation = (rolePresetId = ROLE_PRESETS[0].id): Conversation => {
  const preset = ROLE_PRESETS.find((item) => item.id === rolePresetId) ?? ROLE_PRESETS[0]
  const now = new Date().toISOString()

  return {
    id: createId(),
    title: '新对话',
    rolePresetId: preset.id,
    messages: [createWelcomeMessage(preset)],
    createdAt: now,
    updatedAt: now,
  }
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  const currentConversation = computed(
    () => conversations.value.find((item) => item.id === currentConversationId.value) ?? null,
  )

  const rolePresets = ROLE_PRESETS

  const ensureConversation = () => {
    if (!currentConversation.value) {
      startNewConversation()
    }

    return currentConversation.value
  }

  const hydrate = async () => {
    try {
      const remote = await fetchPersistedState()

      if (remote?.conversations.length) {
        conversations.value = remote.conversations
        currentConversationId.value = remote.currentConversationId ?? remote.conversations[0].id
        return
      }
    } catch (error) {
      console.warn('Remote state hydration failed, fallback to localStorage.', error)
    }

    const saved = loadChatState()

    if (saved?.conversations.length) {
      conversations.value = saved.conversations
      currentConversationId.value = saved.currentConversationId ?? saved.conversations[0].id
      return
    }

    const initialConversation = createConversation()
    conversations.value = [initialConversation]
    currentConversationId.value = initialConversation.id
  }

  const startNewConversation = (rolePresetId = ROLE_PRESETS[0].id) => {
    const conversation = createConversation(rolePresetId)
    conversations.value.unshift(conversation)
    currentConversationId.value = conversation.id
    return conversation
  }

  const switchConversation = (conversationId: string) => {
    currentConversationId.value = conversationId
  }

  const updateConversationTitle = (conversation: Conversation) => {
    const firstUserMessage = conversation.messages.find((item) => item.role === 'user')

    if (!firstUserMessage) {
      conversation.title = '新对话'
      return
    }

    conversation.title = firstUserMessage.content.slice(0, 24) || '新对话'
  }

  const touchConversation = (conversation: Conversation) => {
    conversation.updatedAt = new Date().toISOString()
    conversations.value = [...conversations.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }

  const addMessage = (role: ChatMessage['role'], content: string, status: ChatMessage['status'] = 'done') => {
    const conversation = ensureConversation()

    if (!conversation) {
      return null
    }

    const message: ChatMessage = {
      id: createId(),
      role,
      content,
      createdAt: new Date().toISOString(),
      status,
    }

    conversation.messages.push(message)
    updateConversationTitle(conversation)
    touchConversation(conversation)

    return message
  }

  const updateMessage = (messageId: string, updater: (message: ChatMessage) => void) => {
    const conversation = currentConversation.value

    if (!conversation) {
      return
    }

    const target = conversation.messages.find((item) => item.id === messageId)

    if (!target) {
      return
    }

    updater(target)
    touchConversation(conversation)
  }

  const removeMessage = (messageId: string) => {
    const conversation = currentConversation.value

    if (!conversation) {
      return
    }

    conversation.messages = conversation.messages.filter((item) => item.id !== messageId)
    updateConversationTitle(conversation)
    touchConversation(conversation)
  }

  const setRolePreset = (conversationId: string, rolePresetId: string) => {
    const conversation = conversations.value.find((item) => item.id === conversationId)

    if (!conversation) {
      return
    }

    conversation.rolePresetId = rolePresetId
    touchConversation(conversation)
  }

  const deleteConversation = (conversationId: string) => {
    conversations.value = conversations.value.filter((item) => item.id !== conversationId)

    if (!conversations.value.length) {
      const fallback = createConversation()
      conversations.value = [fallback]
      currentConversationId.value = fallback.id
      return
    }

    if (currentConversationId.value === conversationId) {
      currentConversationId.value = conversations.value[0].id
    }
  }

  watch(
    [conversations, currentConversationId],
    () => {
      const state = {
        conversations: conversations.value,
        currentConversationId: currentConversationId.value,
      }

      saveChatState(state)

      if (syncTimer) {
        clearTimeout(syncTimer)
      }

      syncTimer = setTimeout(() => {
        persistState(state).catch((error) => {
          console.warn('Failed to persist state to remote db.', error)
        })
      }, 600)
    },
    { deep: true },
  )

  return {
    conversations,
    currentConversation,
    currentConversationId,
    rolePresets,
    hydrate,
    addMessage,
    deleteConversation,
    removeMessage,
    setRolePreset,
    startNewConversation,
    switchConversation,
    updateMessage,
  }
})
