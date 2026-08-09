# Modèle de données

Le schéma est écrit ici en SQL pour être lisible et discutable. La **source de vérité exécutable** sera `src/data/db/schema.ts` (Drizzle) ; les migrations en sont générées. Ce document et ce fichier doivent être modifiés dans la même PR.

## Conventions générales

Elles s'appliquent à **toutes** les tables métier, sans exception.

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUIDv7 généré sur l'appareil. Triable par date de création, sans collision entre appareils, prêt pour une future sync. |
| `created_at` | `INTEGER NOT NULL` | Epoch **millisecondes UTC**. |
| `updated_at` | `INTEGER NOT NULL` | Epoch ms UTC. Mis à jour à chaque écriture. Base de la résolution de conflits future. |
| `deleted_at` | `INTEGER` | Suppression **logique**. `NULL` = actif. Aucune requête applicative n'ignore ce filtre. |

Autres règles :

- **Nommage** : tables et colonnes en `snake_case` anglais, tables au pluriel.
- **Booléens** : `INTEGER` 0/1 (SQLite n'a pas de type booléen).
- **Dates de journée** : `TEXT` au format `YYYY-MM-DD`, en **heure locale de l'appareil**. Jamais un timestamp.
- **Instants** : `INTEGER` epoch ms UTC. Jamais une chaîne.
- **Nutriments** : `REAL`, toujours **pour 100 g ou 100 ml**. `NULL` signifie « inconnu », jamais 0.
- **Masses** : kilogrammes. **Longueurs** : centimètres. **Volumes** : millilitres. La conversion impériale est un affichage.
- **Clés étrangères** : `PRAGMA foreign_keys = ON` obligatoire à l'ouverture (SQLite ne l'active pas par défaut).
- **Enums** : `TEXT` avec `CHECK (col IN (...))`. Lisible dans un dump, contrôlé par la base.

---

## Profil et objectifs

```sql
-- Une seule ligne. id fixe = 'singleton'.
CREATE TABLE user_profile (
  id            TEXT PRIMARY KEY DEFAULT 'singleton',
  birth_year    INTEGER,                        -- l'année suffit : moins intrusif que la date exacte
  sex           TEXT CHECK (sex IN ('male','female','unspecified')),
  height_cm     REAL,
  activity_level TEXT CHECK (activity_level IN
                  ('sedentary','light','moderate','very','extra')),
  goal_type     TEXT CHECK (goal_type IN
                  ('lose_slow','lose_moderate','maintain','gain_slow','gain_moderate')),
  unit_system   TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric','imperial')),
  locale        TEXT NOT NULL DEFAULT 'fr',
  week_starts_on INTEGER NOT NULL DEFAULT 1,    -- 1 = lundi
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
-- Le poids courant n'est PAS ici : il vient de body_measurements (source unique).

-- Objectifs historisés : on n'écrase jamais, on ajoute une ligne.
CREATE TABLE nutrition_targets (
  id             TEXT PRIMARY KEY,
  effective_from TEXT NOT NULL,                 -- YYYY-MM-DD local
  kcal           REAL NOT NULL,
  protein_g      REAL NOT NULL,
  carbs_g        REAL NOT NULL,
  fat_g          REAL NOT NULL,
  fiber_g        REAL,
  water_ml       REAL,
  method         TEXT NOT NULL CHECK (method IN ('manual','calculated')),
  -- Traçabilité du calcul, pour pouvoir réexpliquer les chiffres plus tard
  calc_bmr       REAL,
  calc_tdee      REAL,
  calc_adjustment_pct REAL,
  below_safety_floor INTEGER NOT NULL DEFAULT 0,  -- l'utilisateur a forcé une valeur basse (RG-4 SPEC-003)
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER
);
CREATE INDEX idx_targets_effective ON nutrition_targets (effective_from DESC);
```

> **L'objectif applicable à une date D** = la ligne active dont `effective_from` est la plus grande parmi celles `<= D`. C'est ce qui permet à un journal du 15 juillet de garder l'objectif de juillet même après un changement en août.

```sql
CREATE TABLE body_measurements (
  id          TEXT PRIMARY KEY,
  day         TEXT NOT NULL,                    -- YYYY-MM-DD local
  weight_kg   REAL,
  body_fat_pct REAL,
  waist_cm    REAL,
  hips_cm     REAL,
  chest_cm    REAL,
  arm_left_cm REAL,
  arm_right_cm REAL,
  thigh_left_cm REAL,
  thigh_right_cm REAL,
  calf_left_cm REAL,
  calf_right_cm REAL,
  note        TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);
CREATE UNIQUE INDEX idx_measurements_day
  ON body_measurements (day) WHERE deleted_at IS NULL;
```

L'index unique partiel applique RG-2 de SPEC-007 (une mesure par jour) **au niveau de la base**, pas seulement dans le code.

---

## Nutrition

### Aliments

```sql
CREATE TABLE foods (
  id            TEXT PRIMARY KEY,
  source        TEXT NOT NULL CHECK (source IN ('off','usda','custom','recipe')),
  source_id     TEXT,                           -- code OFF ou fdcId USDA
  barcode       TEXT,
  name          TEXT NOT NULL,
  brand         TEXT,
  base_unit     TEXT NOT NULL CHECK (base_unit IN ('g','ml')),

  -- Toutes les valeurs sont POUR 100 base_unit. NULL = inconnu.
  energy_kcal   REAL NOT NULL,                  -- seul nutriment obligatoire (RG-11 SPEC-002)
  protein_g     REAL,
  carbs_g       REAL,
  sugars_g      REAL,
  fat_g         REAL,
  saturated_fat_g REAL,
  fiber_g       REAL,
  salt_g        REAL,
  -- Micronutriments : colonnes prévues, non exposées dans l'UI v1
  sodium_mg     REAL,
  potassium_mg  REAL,
  calcium_mg    REAL,
  iron_mg       REAL,

  energy_is_estimated INTEGER NOT NULL DEFAULT 0, -- kcal recalculées depuis les macros (RG-6 SPEC-001)
  data_quality  INTEGER,                        -- 0-100, complétude, pour le tri des résultats
  is_verified   INTEGER NOT NULL DEFAULT 0,     -- corrigé/validé par l'utilisateur
  recipe_id     TEXT REFERENCES recipes(id),    -- non NULL si source = 'recipe'

  last_used_at  INTEGER,                        -- alimente « Récents »
  use_count     INTEGER NOT NULL DEFAULT 0,     -- alimente « Fréquents »
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  deleted_at    INTEGER
);

CREATE UNIQUE INDEX idx_foods_source ON foods (source, source_id)
  WHERE source_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_foods_barcode  ON foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_frequent ON foods (use_count DESC, last_used_at DESC)
  WHERE deleted_at IS NULL;

-- Recherche plein texte locale : c'est elle qui rend l'app utilisable hors ligne.
CREATE VIRTUAL TABLE foods_fts USING fts5 (
  name, brand,
  content = 'foods', content_rowid = 'rowid',
  tokenize = "unicode61 remove_diacritics 2"    -- « pate » trouve « pâté »
);
-- + triggers AFTER INSERT/UPDATE/DELETE ON foods pour maintenir l'index.
```

> `use_count` et `last_used_at` sont **dénormalisés volontairement** : les recalculer à chaque ouverture de l'écran de recherche coûterait un balayage complet de `diary_entries`. Ils sont incrémentés à chaque ajout au journal.

### Portions

```sql
CREATE TABLE food_portions (
  id          TEXT PRIMARY KEY,
  food_id     TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,                    -- « 1 tranche », « 1 bol »
  grams       REAL NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0,
  source      TEXT NOT NULL CHECK (source IN ('off','usda','custom')),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);
CREATE INDEX idx_portions_food ON food_portions (food_id);
```

### Journal

```sql
CREATE TABLE diary_entries (
  id          TEXT PRIMARY KEY,
  day         TEXT NOT NULL,                    -- YYYY-MM-DD LOCAL (RG-2 SPEC-001)
  meal_slot   TEXT NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  sort_order  INTEGER NOT NULL DEFAULT 0,

  food_id     TEXT REFERENCES foods(id),        -- référence indicative, peut pointer vers un aliment supprimé
  quantity    REAL NOT NULL,                    -- tel que saisi : 2
  unit        TEXT NOT NULL,                    -- tel que saisi : 'slice', 'g', 'ml'
  portion_id  TEXT REFERENCES food_portions(id),
  grams       REAL NOT NULL,                    -- résolu : 60. TOUS les totaux partent d'ici.

  -- ── SNAPSHOT : figé à la saisie, jamais recalculé (ADR-0005) ──
  food_name_snapshot   TEXT NOT NULL,
  food_brand_snapshot  TEXT,
  kcal                 REAL NOT NULL,           -- pour CETTE entrée, pas pour 100 g
  protein_g            REAL,
  carbs_g              REAL,
  fat_g                REAL,
  sugars_g             REAL,
  saturated_fat_g      REAL,
  fiber_g              REAL,
  salt_g               REAL,

  logged_at   INTEGER NOT NULL,                 -- instant réel de la saisie (≠ day)
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);

-- L'index le plus important de l'application : requête exécutée à chaque ouverture.
CREATE INDEX idx_diary_day ON diary_entries (day, meal_slot, sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_diary_food ON diary_entries (food_id);
```

> **Pourquoi dupliquer les macros ici ?** Parce que la fiche d'un produit peut changer (correction sur OFF, modification d'un aliment perso) et qu'un historique nutritionnel qui se réécrit tout seul n'a aucune valeur. C'est de la dénormalisation assumée, argumentée dans [ADR-0005](../adr/0005-snapshot-nutritionnel.md).

```sql
CREATE TABLE water_logs (
  id          TEXT PRIMARY KEY,
  day         TEXT NOT NULL,
  amount_ml   REAL NOT NULL,
  logged_at   INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);
CREATE INDEX idx_water_day ON water_logs (day) WHERE deleted_at IS NULL;
```

---

## Recettes et repas

```sql
CREATE TABLE recipes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  servings        REAL NOT NULL DEFAULT 1 CHECK (servings > 0),
  cooked_weight_g REAL,                         -- facultatif : permet de peser sa part (RG-3 SPEC-004)
  note            TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);

CREATE TABLE recipe_items (
  id             TEXT PRIMARY KEY,
  recipe_id      TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id        TEXT REFERENCES foods(id),
  sub_recipe_id  TEXT REFERENCES recipes(id),   -- un seul niveau d'imbrication (RG-5 SPEC-004)
  grams          REAL NOT NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER,
  CHECK ((food_id IS NOT NULL) <> (sub_recipe_id IS NOT NULL))  -- exactement l'un des deux
);
CREATE INDEX idx_recipe_items ON recipe_items (recipe_id, sort_order);

CREATE TABLE saved_meals (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  default_slot TEXT CHECK (default_slot IN ('breakfast','lunch','dinner','snack')),
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);

-- Références vivantes : un repas enregistré est réévalué à chaque usage (RG-9 SPEC-004)
CREATE TABLE saved_meal_items (
  id            TEXT PRIMARY KEY,
  saved_meal_id TEXT NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  food_id       TEXT REFERENCES foods(id),
  recipe_id     TEXT REFERENCES recipes(id),
  quantity      REAL NOT NULL,
  unit          TEXT NOT NULL,
  grams         REAL NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  deleted_at    INTEGER,
  CHECK ((food_id IS NOT NULL) <> (recipe_id IS NOT NULL))
);
```

---

## Entraînement

### Exercices

```sql
CREATE TABLE exercises (
  id              TEXT PRIMARY KEY,
  slug            TEXT UNIQUE,                  -- 'bench_press' pour les exercices intégrés
  name            TEXT NOT NULL,                -- nom affiché, traduisible
  measure_type    TEXT NOT NULL CHECK (measure_type IN
                    ('weight_reps','bodyweight_reps','weighted_bodyweight',
                     'duration','duration_distance','reps_only')),
  primary_muscle  TEXT NOT NULL CHECK (primary_muscle IN
                    ('chest','back','shoulders','biceps','triceps','forearms',
                     'quads','hamstrings','glutes','calves','abs','traps',
                     'full_body','cardio')),
  secondary_muscles TEXT,                       -- JSON : ["triceps","shoulders"]
  equipment       TEXT NOT NULL CHECK (equipment IN
                    ('barbell','dumbbell','machine','cable','bodyweight',
                     'kettlebell','band','other')),
  instructions    TEXT,
  default_rest_s  INTEGER,
  is_builtin      INTEGER NOT NULL DEFAULT 0,   -- non modifiable (RG-4 SPEC-006)
  is_hidden       INTEGER NOT NULL DEFAULT 0,   -- masqué de la recherche
  builtin_version INTEGER,                      -- version du jeu de données d'origine
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);
CREATE INDEX idx_exercises_muscle ON exercises (primary_muscle, equipment)
  WHERE deleted_at IS NULL AND is_hidden = 0;
```

### Programmes

```sql
CREATE TABLE routines (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);

CREATE TABLE routine_days (            -- une séance type : « Push », « Jambes »
  id          TEXT PRIMARY KEY,
  routine_id  TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);

CREATE TABLE routine_items (
  id             TEXT PRIMARY KEY,
  routine_day_id TEXT NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  exercise_id    TEXT NOT NULL REFERENCES exercises(id),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  target_sets    INTEGER,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_rpe     REAL,
  rest_seconds   INTEGER,
  superset_group INTEGER,                       -- même valeur = même supersérie
  note           TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER
);
CREATE INDEX idx_routine_items ON routine_items (routine_day_id, sort_order);
```

### Séances réalisées

```sql
CREATE TABLE workout_sessions (
  id              TEXT PRIMARY KEY,
  routine_day_id  TEXT REFERENCES routine_days(id),  -- NULL si séance libre
  name            TEXT NOT NULL,                     -- figé à la création (RG-11 SPEC-006)
  day             TEXT NOT NULL,                     -- YYYY-MM-DD local
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER,                           -- NULL = séance active (RG-1 SPEC-005)
  paused_duration_s INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  bodyweight_kg   REAL,                              -- poids du jour, pour le volume au poids du corps
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);
CREATE INDEX idx_sessions_day ON workout_sessions (day DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_active ON workout_sessions (started_at)
  WHERE ended_at IS NULL AND deleted_at IS NULL;
-- « Une seule séance active à la fois » (RG-1 SPEC-005) est appliqué par le repository
-- dans une transaction, pas par une contrainte : SQLite n'accepte pas d'index unique
-- sur une expression constante. [À VÉRIFIER : alternative par trigger BEFORE INSERT]

CREATE TABLE workout_sets (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  exercise_name_snapshot TEXT NOT NULL,             -- lisible même si l'exercice est supprimé
  exercise_order INTEGER NOT NULL,                  -- position de l'exercice dans la séance
  set_index     INTEGER NOT NULL,                   -- 1, 2, 3… au sein de l'exercice
  set_type      TEXT NOT NULL DEFAULT 'normal'
                  CHECK (set_type IN ('warmup','normal','dropset','failure')),

  weight_kg     REAL,
  reps          INTEGER,
  duration_s    INTEGER,
  distance_m    REAL,
  rpe           REAL CHECK (rpe IS NULL OR (rpe >= 6 AND rpe <= 10)),

  completed_at  INTEGER,                            -- NULL = série non effectuée
  rest_taken_s  INTEGER,
  superset_group INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  deleted_at    INTEGER
);
CREATE INDEX idx_sets_session  ON workout_sets (session_id, exercise_order, set_index);
-- Index clé pour « quelle charge la dernière fois ? » (RG-9 SPEC-005)
CREATE INDEX idx_sets_exercise ON workout_sets (exercise_id, completed_at DESC)
  WHERE completed_at IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE personal_records (
  id           TEXT PRIMARY KEY,
  exercise_id  TEXT NOT NULL REFERENCES exercises(id),
  record_type  TEXT NOT NULL CHECK (record_type IN
                 ('max_weight','max_reps','max_volume_session','estimated_1rm')),
  value        REAL NOT NULL,
  weight_kg    REAL,                               -- contexte : la série qui a produit le record
  reps         INTEGER,
  set_id       TEXT REFERENCES workout_sets(id),
  session_id   TEXT REFERENCES workout_sessions(id),
  achieved_on  TEXT NOT NULL,                      -- YYYY-MM-DD local
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER
);
CREATE INDEX idx_records ON personal_records (exercise_id, record_type, value DESC);
```

> `personal_records` est un **cache dérivable** : on pourrait tout recalculer depuis `workout_sets`. On le matérialise parce que la détection d'un record doit être instantanée pendant une séance. Il doit donc exister une commande de reconstruction complète, testée — un cache non reconstructible est une bombe à retardement.

---

## Technique

```sql
CREATE TABLE app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,                    -- JSON
  updated_at  INTEGER NOT NULL
);

-- Préparation à la synchronisation v2 : créée dès la v1, jamais lue tant qu'il n'y a pas de serveur.
CREATE TABLE sync_outbox (
  id          TEXT PRIMARY KEY,
  table_name  TEXT NOT NULL,
  row_id      TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('insert','update','delete')),
  changed_at  INTEGER NOT NULL,
  synced_at   INTEGER
);
CREATE INDEX idx_outbox_pending ON sync_outbox (changed_at) WHERE synced_at IS NULL;
```

Voir [local-first-et-sync.md](local-first-et-sync.md) pour le raisonnement.

---

## Diagramme des relations

```
user_profile (1 ligne)
nutrition_targets ──(par date)──► diary_entries
body_measurements

foods ──┬── food_portions
        ├── diary_entries        (référence + snapshot figé)
        ├── recipe_items
        └── saved_meal_items

recipes ──┬── recipe_items ──► foods | recipes (1 niveau)
          └── foods (source='recipe')

saved_meals ── saved_meal_items ──► foods | recipes

exercises ──┬── routine_items
            ├── workout_sets      (référence + nom figé)
            └── personal_records

routines ── routine_days ──┬── routine_items
                           └── workout_sessions ── workout_sets
```

## Migrations

- Générées par `drizzle-kit generate` depuis `schema.ts`, appliquées au démarrage.
- **Une migration livrée n'est jamais modifiée.** Une correction = une nouvelle migration.
- Toute migration destructrice ou complexe doit avoir un test qui part d'une base de la version précédente remplie de données réalistes.
- Le numéro de version du schéma figure dans les exports (RG-8 de SPEC-008).

## PRAGMA à l'ouverture

```sql
PRAGMA journal_mode = WAL;     -- lectures concurrentes pendant l'écriture
PRAGMA foreign_keys = ON;      -- désactivé par défaut dans SQLite
PRAGMA synchronous = NORMAL;   -- bon compromis durabilité/vitesse en WAL
PRAGMA busy_timeout = 5000;
```

## Points volontairement laissés ouverts

- **Micronutriments détaillés** : les colonnes principales existent, mais une table clé/valeur `food_nutrients` sera nécessaire pour aller plus loin. À faire quand le besoin se présentera, pas avant.
- **Totaux quotidiens matérialisés** : non implémentés. À envisager seulement si les mesures montrent un dépassement du budget de 100 ms.
- **Chiffrement de la base (SQLCipher)** : voir [security-privacy.md](security-privacy.md).
