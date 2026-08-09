import type { TranslationKeys } from './fr';

export const en: TranslationKeys = {
  tabs: {
    diary: 'Diary',
    workout: 'Workout',
    progress: 'Progress',
    settings: 'Settings',
  },
  common: {
    notSet: '—',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    undo: 'Undo',
    retry: 'Retry',
  },
  diary: {
    title: 'Diary',
    placeholder: 'The food diary lands in milestone M1.',
  },
  workout: {
    title: 'Workout',
    placeholder: 'Workout tracking lands in milestone M4.',
  },
  progress: {
    title: 'Progress',
    placeholder: 'Statistics land in milestone M5.',
  },
  settings: {
    title: 'Settings',
    database: 'Database',
    databaseReady: 'Database initialised, migrations applied.',
    version: 'Version',
  },
  db: {
    migrating: 'Preparing the database…',
    error: 'The database could not be opened.',
    errorHint: 'Your data is not lost. Restart the app; if the problem persists, contact support.',
  },
};
