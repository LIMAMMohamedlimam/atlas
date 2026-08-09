# ADR-0002 — SQLite + Drizzle, tout en local

**Statut :** Accepté
**Date :** 2026-08-09

## Contexte

Il faut stocker : des entrées de journal (potentiellement 20 000 sur deux ans), un catalogue d'aliments en cache (jusqu'à des dizaines de milliers), des séances et leurs séries, des mesures corporelles.

Les besoins de lecture réels :

- « toutes les entrées d'un jour donné, groupées par repas » — la requête la plus fréquente de l'app ;
- « recherche textuelle dans le catalogue local », instantanée, hors ligne ;
- « moyenne calorique hebdomadaire sur six mois » — une agrégation sur des milliers de lignes ;
- « la dernière performance sur cet exercice » — une requête indexée pendant une séance.

Ce sont des besoins **relationnels et agrégatifs**. Pas des lectures clé-valeur.

## Options envisagées

### A. SQLite via `expo-sqlite`, avec SQL écrit à la main

**Pour** — Aucune abstraction, contrôle total, performances optimales, dépendance minimale.

**Contre** — Aucune sécurité de typage : une faute de frappe dans un nom de colonne se découvre à l'exécution. Migrations à écrire et à ordonner à la main. Sur une base de vingt tables, la charge de maintenance devient réelle.

### B. SQLite + **Drizzle ORM**

**Pour** — Typage complet dérivé du schéma : renommer une colonne provoque une erreur de compilation partout où elle est utilisée. Génération automatique des migrations (`drizzle-kit`). Reste très proche de SQL — on écrit des jointures, pas des incantations. `useLiveQuery` réactualise l'interface automatiquement quand la base change. Permet de descendre en SQL brut quand c'est nécessaire (agrégations complexes). Empreinte à l'exécution très faible.

**Contre** — Une dépendance de plus, plus jeune que ses concurrents. Les requêtes d'agrégation lourdes finissent souvent en SQL brut de toute façon.

### C. WatermelonDB

**Pour** — Conçu pour le local-first et la synchronisation, très performant sur de grands volumes, réactivité intégrée.

**Contre** — Modèle de données propre (décorateurs, classes) qui s'éloigne de SQL. Configuration plus lourde. Les agrégations statistiques sont son point faible, or c'est un besoin central ici. On paierait une complexité de synchronisation dont on n'a pas besoin en v1.

### D. Realm / MMKV / AsyncStorage

**Contre** — Realm : orienté objet, moteur propriétaire, avenir incertain. MMKV et AsyncStorage : stockage clé-valeur, totalement inadapté aux requêtes d'agrégation. Éliminés d'emblée.

### E. Backend distant (Supabase, Firebase)

**Contre** — Contredit l'exigence du hors-ligne total, impose comptes, authentification, RGPD, coûts d'infrastructure et gestion de conflits, pour zéro bénéfice sur le cœur du produit. Voir [local-first-et-sync.md](../architecture/local-first-et-sync.md).

## Décision

**SQLite via `expo-sqlite`, avec Drizzle ORM et `drizzle-kit` pour les migrations. Aucun serveur.**

Trois raisons :

1. **Les besoins sont relationnels.** Utiliser autre chose que SQL ici serait un choix contre-nature. Les agrégations statistiques ([SPEC-007](../specs/SPEC-007-progression-et-stats.md)) sont triviales en SQL et pénibles partout ailleurs.
2. **Le typage est la protection principale.** Cette app calcule des nombres que l'utilisateur ne peut pas vérifier. Une colonne mal orthographiée qui renvoie `undefined` produit silencieusement un total faux. Drizzle transforme cette classe de bugs en erreurs de compilation.
3. **Drizzle reste proche de SQL.** Quand une requête devient complexe, on écrit du SQL, sans combattre un ORM. On ne troque pas la puissance contre le confort.

**FTS5** (recherche plein texte intégrée à SQLite) est un argument supplémentaire : la recherche locale d'aliments, qui rend l'app utilisable hors ligne, est native au moteur.

## Conséquences

**Ce qu'on accepte :**
- Dépendance à un ORM jeune. Atténuation : les repositories isolent Drizzle du reste du code. Un remplacement toucherait `src/data/`, pas l'application entière.
- Les migrations doivent être testées sérieusement : sans serveur, une migration ratée détruit les données de l'utilisateur, sans recours. Toute migration non triviale a un test partant d'une base réaliste de la version précédente.
- Sans serveur, **la sauvegarde et l'export ne sont pas optionnels** ([SPEC-008](../specs/SPEC-008-donnees-et-vie-privee.md)).

**Ce que ça implique :**
- `src/data/db/schema.ts` est la source de vérité ; `docs/architecture/data-model.md` doit être mis à jour dans la même PR.
- `PRAGMA foreign_keys = ON` et `journal_mode = WAL` à chaque ouverture.
- Aucune requête SQL hors de `src/data/`, vérifié par ESLint.
- Interdiction absolue de modifier une migration déjà livrée.

## Ce qui ferait revenir sur cette décision

- Des performances insuffisantes sur les statistiques après indexation et optimisation sérieuses.
- Drizzle abandonné ou incompatible avec une version d'Expo.
- Un basculement du produit vers un fonctionnement principalement connecté — ce qui reviendrait à changer de produit.
