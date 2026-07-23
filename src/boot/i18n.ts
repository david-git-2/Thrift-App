import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import messages from '../i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

const initialLocale = (localStorage.getItem('app_locale') as MessageLanguages) || 'en-US';

export const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: 'en-US',
  legacy: false,
  messages,
});

export default defineBoot(({ app }) => {
  app.use(i18n as unknown as Parameters<typeof app.use>[0]);
});
