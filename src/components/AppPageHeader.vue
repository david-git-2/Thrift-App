<template>
  <div class="app-page-header">
    <div class="app-page-header__copy">
      <p v-if="eyebrow" class="app-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="app-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="app-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.action" class="app-page-header__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
}>()
</script>
