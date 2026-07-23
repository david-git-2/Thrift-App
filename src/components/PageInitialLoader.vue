<template>
  <div
    class="page-initial-loader"
    :class="{
      'page-initial-loader--compact': compact,
      'page-initial-loader--overlay': overlay
    }"
  >
    <!-- Compact layout: Input / Lookup field skeleton -->
    <div v-if="effectiveType === 'compact'" class="full-width q-pa-sm">
      <div class="row items-center justify-between q-mb-sm">
        <q-skeleton type="text" width="40%" height="20px" animation="wave" />
        <q-skeleton type="QChip" width="55px" animation="wave" />
      </div>
      <q-skeleton
        height="44px"
        square
        animation="wave"
        class="rounded-borders q-mb-xs"
      />
      <div
        v-if="message"
        class="text-caption text-grey-7 text-center q-mt-xs flex items-center justify-center"
      >
        <q-spinner-dots size="16px" color="teal-7" class="q-mr-xs" />
        <span>{{ message }}</span>
      </div>
    </div>

    <!-- Detail page skeleton (Image frame + title + form fields) -->
    <div
      v-else-if="effectiveType === 'detail'"
      class="full-width q-gutter-y-md"
    >
      <q-card flat bordered class="app-card overflow-hidden">
        <q-skeleton height="200px" square animation="wave" />
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <q-skeleton
              type="text"
              width="60%"
              height="26px"
              animation="wave"
            />
            <q-skeleton type="QChip" width="70px" animation="wave" />
          </div>
          <q-skeleton type="text" width="40%" animation="wave" class="q-mb-md" />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-skeleton
                height="40px"
                animation="wave"
                class="rounded-borders"
              />
            </div>
            <div class="col-6">
              <q-skeleton
                height="40px"
                animation="wave"
                class="rounded-borders"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="app-card q-pa-md">
        <q-skeleton type="text" width="30%" animation="wave" class="q-mb-sm" />
        <q-skeleton
          height="44px"
          animation="wave"
          class="rounded-borders q-mb-sm"
        />
        <q-skeleton
          height="44px"
          animation="wave"
          class="rounded-borders"
        />
      </q-card>

      <div
        v-if="message"
        class="text-caption text-grey-7 text-center q-mt-sm flex items-center justify-center"
      >
        <q-spinner-dots size="18px" color="teal-7" class="q-mr-xs" />
        <span>{{ message }}</span>
      </div>
    </div>

    <!-- List layout skeleton -->
    <div v-else-if="effectiveType === 'list'" class="full-width q-gutter-y-sm">
      <q-card
        v-for="n in 4"
        :key="n"
        flat
        bordered
        class="app-card overflow-hidden"
      >
        <div class="row no-wrap items-stretch">
          <div class="col-4">
            <q-skeleton height="90px" square animation="wave" />
          </div>
          <div class="col-8 q-pa-sm flex flex-col justify-between">
            <div>
              <q-skeleton type="text" width="45%" animation="wave" />
              <q-skeleton type="text" width="80%" animation="wave" />
            </div>
            <div class="row items-center justify-between q-mt-xs">
              <q-skeleton type="text" width="35%" animation="wave" />
              <q-skeleton type="QChip" width="50px" animation="wave" />
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Card Grid layout skeleton -->
    <div v-else class="full-width row q-col-gutter-md">
      <div v-for="n in 3" :key="n" class="col-12 col-sm-4">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mb-xs">
            <q-skeleton type="text" width="50%" animation="wave" />
            <q-skeleton type="QAvatar" size="32px" animation="wave" />
          </div>
          <q-skeleton type="text" width="70%" height="32px" animation="wave" />
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    message?: string;
    compact?: boolean;
    overlay?: boolean;
    type?: "detail" | "card" | "list" | "compact";
  }>(),
  {
    message: "",
    compact: false,
    overlay: false
  }
);

const effectiveType = computed(() => {
  if (props.type) return props.type;
  if (props.compact) return "compact";
  return "detail";
});
</script>

<style scoped>
.page-initial-loader {
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.page-initial-loader--compact {
  min-height: 120px;
}

.page-initial-loader--overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  min-height: 100%;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}
</style>
