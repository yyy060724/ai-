<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Promotion } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  submit: [content: string]
}>()

const chatStore = useChatStore()
const draft = ref('')

const currentConversation = computed(() => chatStore.currentConversation)
const rolePresetId = computed({
  get: () => currentConversation.value?.rolePresetId ?? chatStore.rolePresets[0].id,
  set: (value: string) => {
    if (currentConversation.value) {
      chatStore.setRolePreset(currentConversation.value.id, value)
    }
  },
})

const submit = () => {
  const content = draft.value.trim()

  if (!content || props.loading) {
    return
  }

  emit('submit', content)
  draft.value = ''
}

watch(currentConversation, () => {
  draft.value = ''
})
</script>

<template>
  <div class="composer">
    <div class="composer__toolbar">
      <div class="composer__preset">
        <span>角色设定</span>
        <el-select v-model="rolePresetId" size="large">
          <el-option
            v-for="preset in chatStore.rolePresets"
            :key="preset.id"
            :label="`${preset.name} · ${preset.description}`"
            :value="preset.id"
          />
        </el-select>
      </div>

      <el-button text @click="chatStore.startNewConversation(rolePresetId)">新建同角色对话</el-button>
    </div>

    <div class="composer__input">
      <el-input
        v-model="draft"
        type="textarea"
        resize="none"
        :autosize="{ minRows: 3, maxRows: 8 }"
        :placeholder="loading ? 'AI 正在思考中...' : '输入你的问题，Shift + Enter 换行，Enter 发送'"
        :disabled="loading"
        @keydown.enter.exact.prevent="submit"
      />

      <el-button type="primary" size="large" :icon="Promotion" :loading="loading" @click="submit">
        发送
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  border-top: 1px solid var(--app-border);
  background: rgba(255, 255, 255, 0.94);
  padding: 18px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.composer__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.composer__preset {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #475569;
  font-size: 14px;
}

.composer__input {
  display: flex;
  gap: 14px;
  align-items: flex-end;
}

.composer__input .el-textarea {
  flex: 1;
}

@media (max-width: 720px) {
  .composer {
    padding: 16px;
  }

  .composer__toolbar,
  .composer__input,
  .composer__preset {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
