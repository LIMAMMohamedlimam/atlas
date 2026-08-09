# Documentation — Atlas

Carte de la documentation. Chaque dossier a un rôle précis ; si tu ne sais pas où ranger un document, c'est probablement qu'il faut le découper.

## Structure

```
docs/
├── product/        Le « pourquoi » et le « quoi ». Change rarement.
├── specs/          Le comportement attendu, fonctionnalité par fonctionnalité. Source de vérité pour coder et tester.
├── architecture/   Le « comment » technique, transverse.
├── adr/            Les décisions structurantes et leurs raisons. Immuables une fois acceptées.
├── engineering/    Les règles de travail : code, tests, Git, CI, DoD.
├── ai/             Comment travailler efficacement avec des agents IA sur ce dépôt.
└── plan/           Le découpage en jalons et le backlog.
```

## Index

### Produit
- [Vision](product/vision.md) — le problème, l'utilisateur cible, ce qui différencie l'app.
- [Périmètre v1](product/perimetre-v1.md) — dedans / dehors, et les parcours utilisateurs clés.

### Spécifications fonctionnelles
| Réf | Sujet | Jalon |
|---|---|---|
| [SPEC-000](specs/SPEC-000-template.md) | Modèle de spec (à copier) | — |
| [SPEC-001](specs/SPEC-001-journal-nutritionnel.md) | Journal alimentaire quotidien | M1 |
| [SPEC-002](specs/SPEC-002-catalogue-aliments.md) | Recherche, scan code-barres, aliments perso | M2 |
| [SPEC-003](specs/SPEC-003-objectifs-et-macros.md) | Profil, objectifs, calcul des besoins | M1 |
| [SPEC-004](specs/SPEC-004-recettes-et-repas.md) | Recettes et repas enregistrés | M3 |
| [SPEC-005](specs/SPEC-005-seances-entrainement.md) | Séance en direct, séries, chrono de repos | M4 |
| [SPEC-006](specs/SPEC-006-programmes-et-exercices.md) | Bibliothèque d'exercices et programmes | M4 |
| [SPEC-007](specs/SPEC-007-progression-et-stats.md) | Poids, volume, 1RM estimé, graphiques | M5 |
| [SPEC-008](specs/SPEC-008-donnees-et-vie-privee.md) | Export, import, sauvegarde, effacement | M6 |

### Architecture
- [Vue d'ensemble](architecture/overview.md) — couches, dossiers, flux de données.
- [Modèle de données](architecture/data-model.md) — le schéma SQL complet, commenté.
- [Pipeline données alimentaires](architecture/food-data-pipeline.md) — OFF + USDA, normalisation, cache, **licences**.
- [Local-first et préparation à la sync](architecture/local-first-et-sync.md) — pourquoi le schéma est déjà prêt pour le cloud.
- [Sécurité et vie privée](architecture/security-privacy.md) — données de santé, RGPD, Play Store.

### Décisions (ADR)
- [Qu'est-ce qu'un ADR](adr/README.md)
- [0001](adr/0001-react-native-expo.md) React Native + Expo
- [0002](adr/0002-sqlite-drizzle-local-first.md) SQLite + Drizzle, tout en local
- [0003](adr/0003-sources-donnees-alimentaires.md) Open Food Facts + USDA + saisie manuelle
- [0004](adr/0004-gestion-etat.md) Gestion d'état : Drizzle live queries + Zustand
- [0005](adr/0005-snapshot-nutritionnel.md) Figer les macros à la saisie

### Ingénierie
- [Conventions de code](engineering/conventions-code.md)
- [Stratégie de tests](engineering/strategie-de-tests.md)
- [Git et CI](engineering/git-et-ci.md)
- [Définition de « terminé »](engineering/definition-of-done.md)

### Travailler avec des agents IA
- [Guide agents](ai/guide-agents.md) — comment structurer le dépôt pour qu'un agent soit efficace.
- [Workflow d'une tâche](ai/workflow-tache.md) — Explorer → Planifier → Implémenter → Vérifier.
- [Prompts réutilisables](ai/prompts/)

### Plan
- [Roadmap](plan/roadmap.md) — les jalons M0 à M6.
- [Backlog](plan/backlog.md) — tout ce qui est reporté.

## Règles d'écriture

- Un document = un sujet. S'il faut un « et » dans le titre, envisager deux documents.
- Les specs décrivent **le comportement observable**, pas l'implémentation.
- Toute affirmation technique incertaine est marquée `[À VÉRIFIER]` plutôt que présentée comme un fait.
- Un document périmé est pire qu'un document absent : on le supprime ou on le met à jour dans la même PR que le code.
