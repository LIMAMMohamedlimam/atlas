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
    previousDay: 'Jour précédent',
    nextDay: 'Jour suivant',
    today: "Aujourd'hui",
    remaining: 'restantes',
    over: 'au-dessus',
    remainingAccessibility: '{{remaining}} calories restantes sur {{total}}',
    overAccessibility: '{{amount}} calories au-dessus de l’objectif de {{total}}',
    kcal: 'kcal',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collations',
    emptyTitle: 'Aucun repas pour le moment',
    emptyMessage: 'Tes repas apparaîtront ici dès que tu les enregistres.',
    noTarget: 'Aucun objectif défini',
    noTargetHint: 'Définis ton objectif calorique pour suivre tes calories restantes.',
    incompleteData: 'Données incomplètes',
    futureBlocked: 'Le journal des jours à venir n’est pas encore disponible.',
    entryDeleted: 'Entrée supprimée',
    deleteEntry: 'Supprimer l’entrée',
    recalculatedNote: 'recalculé avec les valeurs actuelles',
    loadError: 'Le journal n’a pas pu être chargé.',
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
