<template>
  <div
    v-if="barcodeScanOverlayActive"
    class="barcode-scan-overlay fixed-full flex flex-center"
  >
    <div class="barcode-scan-overlay__panel q-pa-md">
      <div
        class="text-white text-subtitle1 text-weight-bold q-mb-md text-center"
      >
        Point camera at barcode
      </div>
      <q-btn
        color="white"
        text-color="primary"
        label="Cancel"
        class="full-width text-weight-bold app-cta-btn"
        style="min-height: 48px !important; box-shadow: none"
        no-caps
        @click="onCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  barcodeScanOverlayActive,
  cancelBarcodeOverlayScan
} from "../composables/useBarcodeScan";

function onCancel() {
  cancelBarcodeOverlayScan();
}
</script>

<style scoped>
.barcode-scan-overlay {
  visibility: visible;
  z-index: 9999;
  pointer-events: none;
}

.barcode-scan-overlay__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
}
</style>
