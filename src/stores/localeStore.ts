import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Quasar } from 'quasar';
import { i18n, type MessageLanguages } from '../boot/i18n';
import langBn from 'quasar/lang/bn';
import langEnUs from 'quasar/lang/en-US';

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref<MessageLanguages>(
    (localStorage.getItem('app_locale') as MessageLanguages) || 'en-US'
  );

  async function setLocale(locale: MessageLanguages) {
    currentLocale.value = locale;
    localStorage.setItem('app_locale', locale);
    i18n.global.locale.value = locale;

    if (locale === 'bn') {
      Quasar.lang.set(langBn);
    } else {
      Quasar.lang.set(langEnUs);
    }
  }

  // Initial sync of Quasar language pack
  if (currentLocale.value === 'bn') {
    Quasar.lang.set(langBn);
  } else {
    Quasar.lang.set(langEnUs);
  }

  return {
    currentLocale,
    setLocale,
  };
});
