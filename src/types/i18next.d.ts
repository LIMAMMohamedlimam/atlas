import type { TranslationKeys } from '@/lib/i18n/locales/fr';

/** Rend `t('...')` typé : une clé inexistante devient une erreur de compilation. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationKeys;
    };
  }
}
