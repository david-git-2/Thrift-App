<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="app-help-dialog-card glass-card shadow-24 rounded-borders">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none dialog-header">
        <div class="row items-center q-gutter-x-sm">
          <q-avatar
            v-if="icon"
            color="primary-soft"
            text-color="primary"
            :icon="icon"
            size="38px"
            font-size="20px"
          />
          <div>
            <div class="text-h6 text-weight-bold leading-tight">{{ title }}</div>
            <div v-if="subtitle" class="text-caption text-grey-7">{{ subtitle }}</div>
          </div>
        </div>
        <q-space />
        <q-btn icon="ph-regular ph-x" flat round dense v-close-popup class="text-grey-6" />
      </q-card-section>

      <!-- Content / Steps -->
      <q-card-section class="q-pt-md dialog-body">
        <div class="column q-gutter-y-sm">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="help-step-item q-pa-sm rounded-borders bg-grey-1"
          >
            <div class="row items-start no-wrap q-gutter-x-sm">
              <q-avatar
                color="primary"
                text-color="white"
                size="24px"
                font-size="12px"
                class="text-weight-bold q-mt-xs"
              >
                {{ index + 1 }}
              </q-avatar>
              <div class="col">
                <div class="text-subtitle2 text-weight-medium text-dark">
                  {{ step.title }}
                </div>
                <div class="text-caption text-grey-8 line-height-relaxed q-mt-xs">
                  {{ step.description }}
                </div>
                <div
                  v-if="step.tip"
                  class="help-step-tip row items-center q-gutter-x-xs q-mt-xs text-caption text-primary bg-blue-1 q-pa-xs rounded-borders"
                >
                  <q-icon name="ph-regular ph-lightbulb" size="16px" />
                  <span>{{ step.tip }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="bg-grey-1 text-primary q-px-md q-py-sm">
        <q-btn
          flat
          :label="$t('common.gotIt', 'Got It')"
          color="primary"
          v-close-popup
          class="text-weight-bold"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
export interface HelpStep {
  title: string;
  description: string;
  tip?: string;
}

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    subtitle?: string;
    icon?: string;
    steps?: HelpStep[];
  }>(),
  {
    icon: 'ph-regular ph-question',
    steps: () => [],
  }
);

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<style lang="scss" scoped>
.app-help-dialog-card {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
}

.help-step-item {
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #f5f7fa;
  }
}

.help-step-tip {
  border-left: 3px solid var(--q-primary);
}

.line-height-relaxed {
  line-height: 1.45;
}
</style>
