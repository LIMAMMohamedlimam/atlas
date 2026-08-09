# src/domain — règles métier pures

TypeScript pur. **Aucun** import de React, React Native, expo-sqlite ou de la couche `src/data`.
Ces interdits sont appliqués par ESLint, pas seulement par discipline.

C'est ici que vit le risque réel du projet : un mauvais calcul de calories est invisible
et fausse des mois de données. Ces modules sont donc testés en priorité et à 90 % minimum.

À venir par jalon :

| Module | Jalon | Contenu |
|---|---|---|
| `nutrition/energy.ts` | M1 | Mifflin-St Jeor, TDEE, plancher de sécurité (SPEC-003) |
| `nutrition/macros.ts` | M1 | répartition, cohérence, snapshot d'une entrée (ADR-0005) |
| `nutrition/portions.ts` | M2 | résolution portion → grammes |
| `nutrition/validation.ts` | M2 | bornes plausibles, rejet des valeurs aberrantes |
| `training/volume.ts` | M4 | volume, séries comptabilisées |
| `training/one-rep-max.ts` | M4 | Epley, refus au-delà de 12 répétitions |
| `training/records.ts` | M4 | détection de records |
| `stats/` | M5 | moyenne mobile, agrégations |

Les tests tournent dans le projet Jest `domain` (environnement Node, sans émulateur) :
`npm run test:domain`.
