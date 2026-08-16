# src/data/repositories — seul point d'accès aux données

Aucun écran, aucun composant, aucun hook d'interface ne parle directement à SQLite.
Tout passe par un repository. ESLint bloque les imports de `src/data/db` depuis
`src/app` et `src/features`.

Règles :

- Toute lecture filtre `deleted_at IS NULL` — un oubli fait réapparaître des données supprimées.
- Toute écriture met à jour `updated_at` et alimente `sync_outbox`.
- Pas de `SELECT *` : on sélectionne les colonnes utilisées.
- Les repositories ne connaissent pas React.

## Injection de dépendances

Un repository ne va chercher ni la base, ni l'horloge, ni le générateur
d'identifiants : il les reçoit dans un `RepositoryDeps` (voir `shared.ts`).

```ts
const diary = createDiaryRepository({ db, newId, now: nowTimestamp });
```

Deux raisons, pas une préférence de style :

1. `src/lib/id` s'appuie sur `expo-crypto`, indisponible sous Node. Sans injection,
   aucun test d'intégration ne pourrait tourner.
2. Un test déterministe doit pouvoir figer l'horloge et les identifiants.

C'est la même discipline que `src/lib/date`, où `now` est un paramètre.

## État

| Fichier | Jalon | Contenu |
|---|---|---|
| `shared.ts` | M1 | `RepositoryDeps`, journal `sync_outbox` |
| `diary.repository.ts` | M1 | entrées du journal, totaux, copie de repas |
| `nutrition-targets.repository.ts` | M1 | objectifs historisés |
| `food.repository.ts` | M1 → M2 | aliments personnels ; recherche et scan en M2 |

À venir : `workout.repository.ts` (M4).

## Tests

Tests d'intégration sur SQLite en mémoire, projet Jest `app`, base recréée à chaque
test à partir des **migrations réellement livrées** — jamais d'un schéma reconstruit
à la main, qui ne testerait plus rien.

`better-sqlite3` est une dépendance de **développement uniquement**, jamais embarquée
dans l'app. Justification (CLAUDE.md impose de motiver toute dépendance) :

- **Besoin** : la stratégie de tests exige des tests d'intégration sur les
  repositories et les migrations ; le pilote `expo-sqlite` ne tourne pas sous Node.
- **Alternative écartée** : `drizzle-orm/sqlite-proxy`, sans dépendance, est
  asynchrone alors qu'`expo-sqlite` est en mode `'sync'` — les tests n'auraient pas
  exercé le même chemin de code que l'appareil.
- **Alternative écartée** : `node:sqlite` (intégré à Node 24) n'a pas de pilote
  Drizzle. Il reste utilisé tel quel pour les tests de migration, qui n'exécutent
  que du SQL brut.
- **Coût** : dépendance de développement, mature, largement utilisée, avec des
  binaires précompilés pour Apple Silicon.
