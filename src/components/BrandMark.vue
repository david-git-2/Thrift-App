<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
    aria-hidden="true"
  >
    <rect width="28" height="28" rx="7" :fill="fill" fill-opacity="0.18" />
    <path d="M7 9.5C7 8.12 8.12 7 9.5 7H14V14H7V9.5Z" :fill="fill" />
    <path
      d="M14 7H18.5C19.88 7 21 8.12 21 9.5V14H14V7Z"
      :fill="fill"
      fill-opacity="0.7"
    />
    <path
      d="M7 14H14V21H9.5C8.12 21 7 19.88 7 18.5V14Z"
      :fill="fill"
      fill-opacity="0.7"
    />
    <path
      d="M14 14H21V18.5C21 19.88 19.88 21 18.5 21H14V14Z"
      :fill="fill"
      fill-opacity="0.45"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: number | string;
    /** App-scope favicon colour from TradeFlowBD web (`#10b981`). */
    color?: string;
    /** Use `currentColor` so parent text colour controls the mark. */
    useCurrentColor?: boolean;
    class?: string;
  }>(),
  {
    size: 28,
    color: "#10b981",
    useCurrentColor: false
  }
);

const fill = computed(() =>
  props.useCurrentColor ? "currentColor" : props.color
);
</script>
