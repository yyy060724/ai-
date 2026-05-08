import type { ChatRequestMessage } from '@/types/chat'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined)?.trim() || '/api'
const MODEL = ((import.meta.env.VITE_AI_MODEL as string | undefined)?.trim() || 'spark-x') as string

const getEndpoint = (path: string) => `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

export const createStreamChatCompletion = async (messages: ChatRequestMessage[]) => {
  const response = await fetch(getEndpoint('/chat/stream'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `API 请求失败：${response.status}`)
  }

  if (!response.body) {
    throw new Error('当前响应不支持流式读取。')
  }

  return response
}
