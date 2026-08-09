# Atlas — application de nutrition & musculation (Android)

> Nom de code provisoire. Le nom commercial sera choisi avant la publication sur le Play Store.

Application mobile **offline-first** qui combine :

- un **journal alimentaire** façon MyFitnessPal (scan de code-barres, catalogue d'aliments, macros, objectifs) ;
- un **carnet d'entraînement** (programmes, séances en direct, séries/reps/charges, records, progression).

## État du projet

| | |
|---|---|
| Phase actuelle | **Conception** — documentation seulement, pas encore de code |
| Plateforme cible v1 | Android (iOS possible plus tard, la stack le permet) |
| Stack | React Native + Expo, TypeScript strict, SQLite local (Drizzle ORM) |
| Backend | Aucun en v1 — tout est local sur l'appareil |
| Sources nutritionnelles | Open Food Facts + USDA FoodData Central + saisie manuelle |

## Par où commencer

1. **[docs/README.md](docs/README.md)** — la carte de toute la documentation.
2. **[docs/product/vision.md](docs/product/vision.md)** — pourquoi cette app existe.
3. **[docs/product/perimetre-v1.md](docs/product/perimetre-v1.md)** — ce qui est dans la v1 et surtout ce qui n'y est pas.
4. **[docs/plan/roadmap.md](docs/plan/roadmap.md)** — le découpage en jalons livrables.
5. **[CLAUDE.md](CLAUDE.md)** — les règles à respecter quand on code (humain ou agent IA).

## Principes qui guident tout le reste

1. **Local d'abord.** L'app doit être 100 % fonctionnelle en mode avion. Le réseau est un bonus, jamais un prérequis.
2. **Les données de l'utilisateur lui appartiennent.** Export complet à tout moment, aucune télémétrie par défaut.
3. **Rapidité de saisie.** Enregistrer un repas ou une série doit prendre moins de 5 secondes. C'est le critère qui fait vivre ou mourir ce type d'app.
4. **Une spec avant du code.** Chaque fonctionnalité a un document `docs/specs/SPEC-XXX` avec des critères d'acceptation testables.
5. **Décisions tracées.** Tout choix structurant devient un ADR dans `docs/adr/`, pour ne pas le rediscuter tous les trois mois.

## Licences et attributions

Les données Open Food Facts sont sous **ODbL** : leur réutilisation impose attribution et partage à l'identique de la base dérivée. Voir [docs/architecture/food-data-pipeline.md](docs/architecture/food-data-pipeline.md#licences-et-obligations-légales) — c'est une contrainte juridique, pas un détail.
