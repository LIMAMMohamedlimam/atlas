# Journal des versions

Écrit pour un utilisateur, pas pour un développeur.

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : [SemVer](https://semver.org/lang/fr/)

## [0.1.0] — 2026-08-09 · Jalon M0 « Fondations »

Version technique, sans fonctionnalité visible. L'application démarre, affiche
quatre onglets vides et initialise sa base de données locale.

### Ajouté

- Projet React Native / Expo (SDK 57) en TypeScript strict.
- Navigation par onglets : Journal, Entraînement, Progression, Réglages.
- Base de données SQLite locale avec Drizzle ORM, migrations versionnées appliquées
  au démarrage, PRAGMA `foreign_keys` et `WAL` activés.
- Thème clair / sombre suivant le réglage système.
- Traductions français et anglais, typées : une clé inexistante ne compile pas.
- Bibliothèques socles testées : conversions d'unités, dates locales, UUIDv7.
- Sauvegarde automatique Android (`allowBackup`) désactivée : une base de données
  de santé ne part pas sur Google Drive sans action explicite.
