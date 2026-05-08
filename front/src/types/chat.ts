export type MessageRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  status?: 'streaming' | 'done' | 'error'
  errorMessage?: string
}

export interface RolePreset {
  id: string
  name: string
  prompt: string
  description: string
}

export interface Conversation {
  id: string
  title: string
  rolePresetId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatRequestMessage {
  role: MessageRole
  content: string
}
