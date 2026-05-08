<script setup lang="ts">
import { onMounted } from 'vue'
import ChatContainer from '@/components/ChatContainer.vue'
import ConversationSidebar from '@/components/ConversationSidebar.vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

onMounted(() => {
  chatStore.hydrate()
})
</script>

<template>
  <div class="chat-view">
    <ConversationSidebar />
    <ChatContainer />
  </div>
</template>

<style scoped>
.chat-view {
  min-height: 100vh;
  display: flex;
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.18), transparent 32%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

@media (max-width: 960px) {
  .chat-view {
    flex-direction: column;
  }
}
</style>
