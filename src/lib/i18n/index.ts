import i18n from 'i18next';
import { getLocales } from 'expo-localization';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { fr } from './locales/fr';

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const isSupported = (code: string): code is Language =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(code);

const deviceLanguage = (): Language => {
  const code = getLocales()[0]?.languageCode ?? 'fr';
  return isSupported(code) ? code : 'fr';
};

// Faux positif : `i18n.use` est bien la méthode de l'instance i18next,
// pas le hook `use` que le paquet exporte également.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: deviceLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
