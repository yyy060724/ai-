import { STORAGE_KEY } from '@/utils/constants'
import type { Conversation } from '@/types/chat'

interface PersistedChatState {
  conversations: Conversation[]
  currentConversationId: string | null
}

export const loadChatState = (): PersistedChatState | null => {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PersistedChatState
  } catch (error) {
    console.warn('Failed to parse chat state from localStorage.', error)
    return null
  }
}

export const saveChatState = (state: PersistedChatState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export type { PersistedChatState }
