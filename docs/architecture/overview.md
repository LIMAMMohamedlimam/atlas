# Architecture — vue d'ensemble

## En une phrase

Une application React Native/Expo **sans backend**, où toute la vérité vit dans une base SQLite locale, avec deux appels réseau facultatifs pour enrichir un catalogue d'aliments.

## Le schéma général

```
┌──────────────────────────────────────────────────────┐
│  UI — écrans et composants (React, Expo Router)      │
│  Ne connaît ni SQL ni HTTP. Affiche, appelle.        │
└───────────────────────┬──────────────────────────────┘
                        │ hooks
┌───────────────────────▼──────────────────────────────┐
│  Domaine — règles métier pures (TypeScript)          │
│  Calculs, conversions, validations. Zéro I/O.        │
│  → 100 % testable sans émulateur                     │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│  Données — repositories                              │
│  Seule couche autorisée à parler à SQLite            │
└──────┬──────────────────────────────┬────────────────┘
       │                              │
┌──────▼──────────────┐   ┌───────────▼────────────────┐
│  SQLite (Drizzle)   │   │  Sources externes          │
│  source de vérité   │   │  Open Food Facts, USDA     │
│  toujours dispo     │   │  lecture seule, facultatif │
└─────────────────────┘   └────────────────────────────┘
```

**La règle d'or : les flèches ne remontent jamais.** Un composant n'accède jamais à SQLite ; le domaine n'appelle jamais le réseau ; un repository ne connaît pas React.

## Pourquoi ce découpage

Parce qu'il permet de tester la partie risquée sans émulateur. Les calculs de macros, les conversions d'unités, l'estimation de 1RM, la normalisation des données OFF — tout ça est du TypeScript pur, testable en millisecondes. C'est là que sont les bugs qui comptent : un mauvais calcul de calories est invisible et fausse des mois de données.

C'est aussi ce qui rend le travail avec un agent IA fiable : chaque couche a un contrat clair, et l'agent peut modifier le domaine sans risquer de casser l'affichage.

## Arborescence du code

```
src/
├── app/                    Écrans (Expo Router, routage par fichiers)
│   ├── (tabs)/
│   │   ├── index.tsx           Journal du jour
│   │   ├── workout.tsx         Entraînement
│   │   ├── progress.tsx        Progression
│   │   └── settings.tsx
│   ├── food/[id].tsx
│   ├── food/search.tsx
│   ├── food/scan.tsx
│   ├── workout/session/[id].tsx
│   └── _layout.tsx
│
├── domain/                 Logique métier pure — AUCUN import de React ni de SQLite
│   ├── nutrition/
│   │   ├── energy.ts           Mifflin-St Jeor, TDEE, plancher de sécurité
│   │   ├── macros.ts           Répartition, cohérence, totaux
│   │   ├── portions.ts         Résolution portion → grammes
│   │   └── validation.ts       Bornes plausibles, valeurs aberrantes
│   ├── training/
│   │   ├── volume.ts
│   │   ├── one-rep-max.ts      Epley et ses limites
│   │   └── records.ts          Détection de records
│   └── stats/
│       ├── moving-average.ts
│       └── aggregation.ts
│
├── data/
│   ├── db/
│   │   ├── schema.ts           Schéma Drizzle — SOURCE DE VÉRITÉ du modèle
│   │   ├── client.ts           Ouverture de la base, PRAGMA
│   │   └── migrations/         Générées par drizzle-kit, jamais éditées après livraison
│   ├── repositories/           Seul point d'accès aux données
│   │   ├── diary.repository.ts
│   │   ├── food.repository.ts
│   │   ├── workout.repository.ts
│   │   └── ...
│   ├── queries/                Requêtes SQL d'agrégation (stats)
│   └── remote/
│       ├── openfoodfacts/      client + mapper vers CanonicalFood
│       ├── usda/               client + mapper vers CanonicalFood
│       └── types.ts            CanonicalFood : le contrat commun
│
├── features/               Composants métier, par domaine fonctionnel
│   ├── diary/
│   ├── food-search/
│   ├── workout-session/
│   └── progress/
│
├── ui/                     Composants génériques sans métier
│   ├── components/             Button, Card, NumberInput, Sheet…
│   ├── theme/                  tokens, clair/sombre
│   └── charts/
│
├── lib/
│   ├── units/                  TOUTES les conversions passent ici
│   ├── date/                   Dates locales vs UTC — le piège n°1
│   ├── id/                     Génération d'UUIDv7
│   └── i18n/
│
└── stores/                 État éphémère (Zustand) : séance active, préférences UI
```

## Stack technique

| Besoin | Choix | Pourquoi |
|---|---|---|
| Framework | React Native + **Expo** (dev build) | Voir [ADR-0001](../adr/0001-react-native-expo.md) |
| Langage | TypeScript, mode `strict` | Non négociable sur un projet manipulant des nombres |
| Navigation | **Expo Router** | Routage par fichiers, deep links gratuits |
| Base locale | **expo-sqlite** + **Drizzle ORM** | Voir [ADR-0002](../adr/0002-sqlite-drizzle-local-first.md) |
| Migrations | **drizzle-kit** | Versionnées, générées depuis le schéma |
| État serveur/local | **Drizzle live queries** | L'UI se réactualise seule quand la base change |
| État UI | **Zustand** | Léger, pas de boilerplate ; réservé à l'éphémère |
| Requêtes réseau | **TanStack Query** | Uniquement pour OFF/USDA : cache, réessais, annulation |
| Listes longues | **FlashList** (Shopify) | Le journal et la recherche peuvent atteindre des milliers de lignes |
| Caméra / code-barres | **expo-camera** | Décodage intégré, pas de dépendance supplémentaire |
| Notifications | **expo-notifications** | Chrono de repos en arrière-plan |
| Tâches de fond | **expo-background-task** | Sauvegarde hebdomadaire |
| Graphiques | à trancher en M5 | `victory-native` (Skia) vs SVG maison — ADR à écrire |
| Tests unitaires | **Jest** + `@testing-library/react-native` | |
| Tests E2E | **Maestro** | Plus simple que Detox pour un projet solo |
| Qualité | ESLint + Prettier + `tsc --noEmit` | Bloquants en CI |
| Build | **EAS Build** | Compilation cloud, pas d'usine à gaz locale |

**Note de version :** le SDK Expo évolue tous les 6 mois. Prendre la dernière version stable au moment de l'initialisation du projet et la figer pour toute la v1. `[À VÉRIFIER au démarrage de M0]`

Expo Go ne suffira pas (modules natifs) : il faut un **development build** dès M0.

## Flux de données typiques

### Ajouter un aliment au journal (hors ligne)

```
Écran  → useAddDiaryEntry()
       → domain/portions.resolveGrams(qty, unit, food)
       → domain/macros.snapshotFrom(food, grams)
       → diaryRepository.insert(entry)
       → SQLite
       → live query → l'écran du jour se réactualise seul
```

Aucun appel réseau, aucun état de chargement.

### Chercher un aliment en ligne

```
Écran → recherche locale (SQLite FTS5) → affichage immédiat
      ↘ après 400 ms d'inactivité
        TanStack Query → client OFF → mapper → CanonicalFood[]
                                              → section « Base en ligne »
        (à la sélection) → copie dans SQLite → disponible hors ligne pour toujours
```

Point clé : **le résultat local s'affiche toujours en premier**, le réseau ne fait qu'ajouter.

## Décisions structurantes déjà prises

1. **Tout est local.** Aucun backend en v1. Le schéma est néanmoins prêt pour une synchronisation future ([local-first-et-sync.md](local-first-et-sync.md)).
2. **Les entrées de journal figent leurs macros.** [ADR-0005](../adr/0005-snapshot-nutritionnel.md).
3. **Suppressions logiques partout.** `deleted_at` non nul = supprimé. Permet l'annulation et la sync.
4. **Identifiants UUIDv7 en texte.** Générables hors ligne, triables par date de création, sans collision entre appareils.
5. **Valeurs nutritionnelles toujours pour 100 g/ml.** Toute autre représentation est une vue.
6. **Dates : le jour de journal est une chaîne locale `YYYY-MM-DD`, les horodatages sont des entiers epoch ms UTC.** Les mélanger est la source de bug la plus fréquente de ce type d'app.

## Ce que l'architecture interdit explicitement

- Requête SQL dans un composant.
- `import` de React dans `src/domain/`.
- Appel réseau ailleurs que dans `src/data/remote/`.
- Conversion d'unité en ligne dans du code métier ou d'affichage.
- Écriture en base sans passer par un repository.

Ces interdits sont vérifiés automatiquement par une règle ESLint de frontières (`import/no-restricted-paths`), pas seulement par bonne volonté.

## Performance : les points de vigilance

| Risque | Parade |
|---|---|
| Recherche d'aliments lente | Index FTS5 sur `foods`, recherche locale avant réseau |
| Journal lent avec 2 ans d'historique | Index `(day, meal_slot)`, requêtes limitées à un jour |
| Stats lentes | Agrégation en SQL, jamais en JS sur toutes les lignes |
| Séance qui saccade | FlashList, mémoïsation des lignes de séries, écriture asynchrone |
| Démarrage lent | Migrations rapides, aucun chargement de données au boot hors préférences |

## Documents liés

- [Modèle de données](data-model.md)
- [Pipeline données alimentaires](food-data-pipeline.md)
- [Local-first et sync](local-first-et-sync.md)
- [Sécurité et vie privée](security-privacy.md)
