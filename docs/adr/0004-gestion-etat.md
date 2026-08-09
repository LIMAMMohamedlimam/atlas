# ADR-0004 — Drizzle live queries + Zustand, pas de Redux

**Statut :** Accepté
**Date :** 2026-08-09

## Contexte

Question classique et souvent mal tranchée : comment gérer l'état dans une application React Native ?

La particularité ici : **presque tout l'état est déjà en base de données.** Le journal, les séances, les aliments, les objectifs — tout est en SQLite. Ce qui reste vraiment « en mémoire » est très mince :

- l'état de la séance en cours (mais il est **aussi** persisté, RG-2 de [SPEC-005](../specs/SPEC-005-seances-entrainement.md)) ;
- des états d'interface : le jour affiché, l'onglet actif, un texte de recherche en cours de frappe ;
- le résultat en vol d'une requête réseau OFF/USDA.

Le piège habituel est de recopier la base dans un store global, ce qui crée immédiatement deux sources de vérité et des bugs de désynchronisation impossibles à reproduire.

## Options envisagées

### A. Redux Toolkit

**Pour** — Standard connu, outils de développement excellents, prévisible.

**Contre** — Beaucoup de code d'infrastructure. Surtout : il pousse à **dupliquer la base dans le store**, ce qui est exactement le problème à éviter. Sur une app local-first, la base *est* le store.

### B. TanStack Query pour tout

**Pour** — Excellent modèle de cache, invalidation, réessais.

**Contre** — Conçu pour de l'état **serveur**, avec une latence à masquer. Sur des lectures SQLite d'une milliseconde, ses mécanismes (données périmées, réessai, cache) sont du poids inutile. On se retrouverait à invalider manuellement des clés après chaque écriture locale — un travail que la base peut faire toute seule.

### C. Drizzle `useLiveQuery` + Zustand pour l'éphémère

**Pour** — `useLiveQuery` observe la base : après une écriture, tous les écrans concernés se réactualisent **automatiquement**, sans invalidation manuelle, sans risque d'oubli. Une seule source de vérité : SQLite. Zustand gère le peu d'état purement UI, sans cérémonie. Très peu de code.

**Contre** — Le mécanisme de réactivité de Drizzle est plus récent et moins éprouvé que Redux. Granularité d'invalidation potentiellement grossière : une écriture peut déclencher plus de recalculs que nécessaire. `[À VÉRIFIER : mesurer sur l'écran de séance, le plus sollicité]`

### D. Contexte React uniquement

**Contre** — Re-rendus non maîtrisés dès que l'arbre grossit, pas de sélecteurs. Convient à un thème, pas à l'état d'une application.

## Décision

**Trois outils, trois rôles nettement séparés :**

| Type d'état | Outil | Exemples |
|---|---|---|
| Données persistantes | **SQLite via Drizzle `useLiveQuery`** | journal, séances, aliments, objectifs, mesures |
| État UI éphémère | **Zustand** | jour affiché, filtres de recherche, chrono de repos en cours |
| État réseau | **TanStack Query** | résultats de recherche OFF/USDA |

**La règle qui compte : si une donnée survit à la fermeture de l'app, elle vit en base, pas dans un store.** Un store n'est jamais une copie de la base.

Cas limite explicité — la **séance active** : elle est persistée en base (survit à un arrêt forcé) *et* exposée par un store Zustand pour le chrono et l'état d'interface. Le store est un **cache de lecture et un état d'affichage**, jamais la vérité. En cas de divergence, la base gagne.

## Conséquences

**Ce qu'on accepte :**
- Trois bibliothèques d'état plutôt qu'une. Justifié parce que leurs rôles ne se recouvrent pas : si un développeur hésite sur laquelle utiliser, c'est que la donnée est mal classée.
- Une dépendance à la réactivité de Drizzle, moins éprouvée. Atténuation : elle est utilisée à travers des hooks maison (`useDiaryDay`, `useActiveSession`), donc remplaçable sans toucher aux écrans.
- Des re-rendus potentiellement trop larges. À mesurer, à optimiser seulement si c'est constaté.

**Ce que ça implique :**
- Aucun `useState` contenant des données métier venues de la base.
- Les stores Zustand ne contiennent **jamais** de tableau d'entités persistées.
- Chaque accès aux données passe par un hook dédié dans `src/features/*/hooks/`, qui encapsule le repository. Les composants ne voient ni SQL ni Drizzle.

## Ce qui ferait revenir sur cette décision

- Des problèmes de performance mesurés et non résolus par la mémoïsation sur l'écran de séance.
- Un abandon de `useLiveQuery` par Drizzle.
- Un besoin d'état partagé complexe qui n'entrerait dans aucune des trois catégories — ce qui serait d'abord le signe d'un problème de conception.
