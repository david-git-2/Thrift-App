<template>
  <div class="app-page-header">
    <div class="app-page-header__copy">
      <p v-if="eyebrow" class="app-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="app-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="app-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div
      v-if="$slots['quick-scan'] || showQuickScan || showHelp || $slots.action"
      class="app-page-header__actions flex items-center q-gutter-x-xs"
    >
      <q-btn
        v-if="showHelp"
        flat
        round
        dense
        icon="ph-regular ph-question"
        color="grey-7"
        class="min-tap-target"
        @click="$emit('help')"
      >
        <q-tooltip>{{ helpTooltip || 'Help & Guide' }}</q-tooltip>
      </q-btn>
      <slot name="quick-scan">
        <q-btn
          v-if="showQuickScan"
          flat
          round
          dense
          icon="ph-regular ph-qr-code"
          color="primary"
          to="/scan"
          class="min-tap-target"
          @click="$emit('quick-scan')"
        >
          <q-tooltip>Quick Scan Barcode</q-tooltip>
        </q-btn>
      </slot>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    eyebrow?: string;
    showQuickScan?: boolean;
    showHelp?: boolean;
    helpTooltip?: string;
  }>(),
  {
    showQuickScan: false,
    showHelp: false,
  }
);

defineEmits<{
  (e: 'quick-scan'): void;
  (e: 'help'): void;
}>();
</script>
