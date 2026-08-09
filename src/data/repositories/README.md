# src/data/repositories — seul point d'accès aux données

Aucun écran, aucun composant, aucun hook d'interface ne parle directement à SQLite.
Tout passe par un repository. ESLint bloque les imports de `src/data/db` depuis
`src/app` et `src/features`.

Règles :

- Toute lecture filtre `deleted_at IS NULL` — un oubli fait réapparaître des données supprimées.
- Toute écriture met à jour `updated_at` et alimente `sync_outbox`.
- Pas de `SELECT *` : on sélectionne les colonnes utilisées.
- Les repositories ne connaissent pas React.

À venir : `diary.repository.ts` (M1), `food.repository.ts` (M2),
`workout.repository.ts` (M4).

Tests d'intégration sur SQLite en mémoire, projet Jest `app`.
