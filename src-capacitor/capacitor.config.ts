import { defineCapacitorConfig } from '@quasar/app-vite/capacitor';

export default defineCapacitorConfig({
  appId: 'com.brandwala.thriftapp',
  appName: 'Thrift App',
  // Avoid white flash between native splash dismiss and first Vue paint
  backgroundColor: '#030f08'
});
