import type { PersistedChatState } from '@/utils/storage'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined)?.trim() || '/api'

const getEndpoint = (path: string) => `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

export const fetchPersistedState = async () => {
  const response = await axios.get(getEndpoint('/state'))
  return response.data.state
}

export const persistState = async (state: PersistedChatState) => {
  await axios.put(getEndpoint('/state'), state, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
