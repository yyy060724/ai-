import type { RolePreset } from '@/types/chat'

export const STORAGE_KEY = 'ai-chat-assistant-state'

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'general',
    name: '通用助手',
    description: '适合日常问答、总结和思路整理。',
    prompt: '你是一名专业、友好且简洁的 AI 助手，请使用中文回答，必要时给出结构化建议。',
  },
  {
    id: 'developer',
    name: '编程助手',
    description: '擅长代码解释、排错和工程实现建议。',
    prompt: '你是一名资深全栈工程师，请优先给出可执行的方案、代码示例与风险提示。',
  },
  {
    id: 'writer',
    name: '写作助手',
    description: '适合润色文案、写提纲和生成内容。',
    prompt: '你是一名专业中文写作顾问，请输出更有条理、更自然、更适合传播的内容。',
  },
]
