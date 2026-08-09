/**
 * Français : langue de référence. Sa forme définit les clés valides
 * (voir src/types/i18next.d.ts), ce qui rend `t('clé.inconnue')` non compilable.
 * Pas de `as const` ici : on type les CLÉS, pas les valeurs, sinon aucune
 * autre langue ne pourrait satisfaire le type.
 */
export const fr = {
  tabs: {
    diary: 'Journal',
    workout: 'Entraînement',
    progress: 'Progression',
    settings: 'Réglages',
  },
  common: {
    notSet: '—',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    undo: 'Annuler',
    retry: 'Réessayer',
  },
  diary: {
    title: 'Journal',
    placeholder: 'Le journal alimentaire arrive au jalon M1.',
  },
  workout: {
    title: 'Entraînement',
    placeholder: "Le suivi d'entraînement arrive au jalon M4.",
  },
  progress: {
    title: 'Progression',
    placeholder: 'Les statistiques arrivent au jalon M5.',
  },
  settings: {
    title: 'Réglages',
    database: 'Base de données',
    databaseReady: 'Base initialisée, migrations appliquées.',
    version: 'Version',
  },
  db: {
    migrating: 'Préparation de la base de données…',
    error: 'La base de données n’a pas pu être ouverte.',
    errorHint:
      'Tes données ne sont pas perdues. Redémarre l’application ; si le problème persiste, contacte le support.',
  },
};

export type TranslationKeys = typeof fr;
