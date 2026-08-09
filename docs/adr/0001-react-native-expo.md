# ADR-0001 — React Native + Expo plutôt que du natif Kotlin

**Statut :** Accepté
**Date :** 2026-08-09

## Contexte

Application Android de nutrition et de musculation, développée par une seule personne. Contraintes réelles :

- projet solo, temps limité, vitesse d'itération déterminante ;
- besoins natifs identifiés : caméra pour le scan de code-barres, notifications pour le chrono de repos, tâches de fond pour la sauvegarde, SQLite ;
- interface dense en listes et en formulaires numériques, avec une exigence de fluidité sur l'écran de séance ;
- iOS envisageable plus tard, mais pas un objectif de la v1.

## Options envisagées

### A. Kotlin + Jetpack Compose (natif)

**Pour** — Performances maximales. Accès direct à Health Connect et à toutes les API Android. Room, WorkManager et l'écosystème officiel sont excellents. Pas de couche d'abstraction entre le code et la plateforme.

**Contre** — Aucune réutilisation si iOS devient un objectif : il faudrait tout réécrire (Kotlin Multiplatform partagerait la logique, pas l'interface). Cycle de compilation plus lent que le rechargement à chaud. Écosystème de bibliothèques nutritionnelles et de graphiques moins fourni.

### B. React Native + Expo

**Pour** — Rechargement à chaud, donc itérations très rapides sur l'interface, ce qui compte quand on cherche encore le bon design d'écran de séance. Un seul langage (TypeScript) du domaine à l'UI, donc les calculs métier sont testables en Node, sans émulateur. Expo fournit clé en main caméra, notifications, SQLite, tâches de fond, système de fichiers, mises à jour. EAS Build évite de maintenir une chaîne de compilation locale. Portage iOS ultérieur peu coûteux. Bibliothèques de graphiques et de listes performantes (FlashList, Skia) matures.

**Contre** — Une couche d'abstraction en plus : quand un bug est côté natif, le diagnostic est plus difficile. Dépendance au calendrier de sortie d'Expo (migration de SDK tous les six mois). Performances en retrait sur les listes très longues si on n'utilise pas les bons outils. Expo Go ne suffit pas dès qu'on ajoute des modules natifs : il faut un *development build* dès le premier jour.

### C. Flutter

**Pour** — Interface très fluide, rendu constant sur toutes les plateformes, excellent outillage.

**Contre** — Dart, un langage de plus à maîtriser, sans réutilisation ailleurs. Écosystème de bibliothèques santé/nutrition moins riche. Intégration moins naturelle avec l'outillage d'assistance IA orienté TypeScript.

## Décision

**React Native + Expo, en TypeScript strict, avec un development build dès M0.**

Le facteur décisif n'est pas la performance — les trois options sont largement suffisantes pour cette app — mais **la vitesse d'itération sur un projet solo**. L'écran de séance et l'écran de recherche d'aliments vont être redessinés dix fois ; le rechargement à chaud fait gagner des heures cumulées.

Deuxième facteur : **un seul langage pour tout**. Les calculs sensibles (macros, 1RM, normalisation OFF) sont du TypeScript pur, testés en millisecondes sans émulateur. En Kotlin, ce serait aussi le cas, mais avec un cycle de compilation plus lourd et un partage impossible avec un futur portage iOS.

L'option Kotlin natif aurait été retenue si Health Connect ou les widgets figuraient dans le périmètre v1. Ce n'est pas le cas ([périmètre v1](../product/perimetre-v1.md)).

## Conséquences

**Ce qu'on accepte :**
- Une migration de SDK Expo à prévoir tous les six mois environ. On fige la version pour toute la v1 et on migre entre deux jalons, jamais pendant.
- Des performances de liste à surveiller : FlashList obligatoire dès qu'une liste peut dépasser cinquante éléments.
- Un diagnostic plus difficile en cas de bug natif — c'est le prix de l'abstraction.
- L'intégration de Health Connect, si elle arrive, demandera un module natif ou une bibliothèque tierce.

**Ce que ça implique en pratique :**
- Development build EAS obligatoire dès M0, Expo Go ne sera jamais suffisant.
- TypeScript en mode `strict`, sans exception : c'est la contrepartie du confort de JavaScript sur une app qui manipule des nombres partout.
- Frontières de couches vérifiées par ESLint (`src/domain` ne doit rien importer de React), car la liberté de JavaScript facilite les mélanges.

## Ce qui ferait revenir sur cette décision

- Un besoin natif lourd et central (Health Connect au cœur du produit, Wear OS, widgets complexes).
- Des performances insuffisantes sur l'écran de séance après optimisation sérieuse.
- Un abandon ou une dégradation forte de l'écosystème Expo.
