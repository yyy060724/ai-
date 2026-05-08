<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const conversations = computed(() => chatStore.conversations)
const currentConversationId = computed(() => chatStore.currentConversationId)

const handleCreate = () => {
  chatStore.startNewConversation()
}

const handleDelete = async (conversationId: string) => {
  try {
    await ElMessageBox.confirm('确认删除这个会话吗？删除后无法恢复。', '删除会话', {
      type: 'warning',
    })

    chatStore.deleteConversation(conversationId)
  } catch {
    // Ignore cancel action.
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__header">
      <div>
        <p class="sidebar__eyebrow">AI Chat</p>
        <h1>智能对话助手</h1>
      </div>
      <el-button type="primary" :icon="Plus" circle @click="handleCreate" />
    </div>

    <div class="sidebar__list">
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ 'is-active': conversation.id === currentConversationId }"
        @click="chatStore.switchConversation(conversation.id)"
      >
        <div class="conversation-item__content">
          <strong>{{ conversation.title }}</strong>
          <span>{{ new Date(conversation.updatedAt).toLocaleString('zh-CN') }}</span>
        </div>

        <el-button
          text
          type="danger"
          class="conversation-item__delete"
          :icon="Delete"
          @click.stop="handleDelete(conversation.id)"
        />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 300px;
  border-right: 1px solid var(--app-border);
  background: rgba(12, 18, 32, 0.95);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 18px;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar__eyebrow {
  margin: 0 0 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar__header h1 {
  margin: 0;
  font-size: 20px;
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.conversation-item {
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition: 0.2s ease;
}

.conversation-item:hover,
.conversation-item.is-active {
  border-color: rgba(125, 177, 255, 0.4);
  background: rgba(59, 130, 246, 0.18);
}

.conversation-item__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.conversation-item__content strong {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-item__content span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.conversation-item__delete {
  opacity: 0.75;
}

@media (max-width: 960px) {
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--app-border);
  }
}
</style>
