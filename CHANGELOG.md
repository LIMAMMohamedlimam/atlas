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

## [0.2.0] — 2026-08-16 · Jalon M1 « Journal nutritionnel manuel »

On peut enfin suivre une journée complète en saisissant ses aliments à la main.
Tout reste sur l'appareil : aucune donnée ne quitte le téléphone.

### Ajouté

- **Journal du jour** : quatre repas (petit-déjeuner, déjeuner, dîner, collations),
  anneau des calories restantes, barres de progression des protéines, glucides et
  lipides, navigation entre les jours (passé illimité, futur bloqué).
- **Ajout et modification d'aliments** : chaque entrée fige ses valeurs nutritionnelles
  à la saisie ; modifier une fiche ne réécrit jamais l'historique. La quantité se
  modifie avec un recalcul depuis la fiche courante, signalé dans l'interface.
- **Suppression avec annulation** : balayage vers la gauche, « Annuler » pendant 5 s.
- **Création d'aliments personnels** : valeurs pour 100 g ou 100 ml ; l'énergie peut
  être estimée depuis les trois macros (4/4/9) quand elle n'est pas saisie.
- **Objectifs** : à la première ouverture, un court onboarding propose soit de saisir
  ses chiffres (sans stocker de profil), soit de les calculer (Mifflin-St Jeor, avec
  récapitulatif BMR / TDEE / ajustement avant validation). Le plancher de sécurité
  (1500 kcal homme / 1200 femme) est appliqué, et un déficit sous ce seuil exige une
  confirmation. Écran « Objectifs » dans les réglages, avec bascule Calculé / Manuel
  et contrôle de cohérence des macros.
- **Suivi de l'eau** : incréments configurables (250 ml par défaut), total du jour.

### Changé

- Aucun conseil médical : bandeau d'avertissement dans l'onboarding et les réglages.

