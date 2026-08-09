# Roadmap

## Principe de découpage

Chaque jalon produit **quelque chose d'utilisable**, pas une couche technique. À la fin de M1, l'app compte déjà des calories — imparfaitement, mais réellement. C'est ce qui permet de s'en servir tôt, et donc de découvrir ce qui cloche avant d'avoir tout construit.

Les durées sont indicatives, calibrées pour un projet solo à temps partiel (~10 h/semaine). Ce qui compte est **l'ordre**, pas le calendrier.

```
M0 Fondations ──► M1 Journal ──► M2 Catalogue ──► M3 Recettes
                                       │
                                       ▼
                              M4 Entraînement ──► M5 Progression ──► M6 Sortie
```

| Jalon | Contenu | Durée estimée | Version |
|---|---|---|---|
| **M0** | Fondations techniques | 1–2 sem. | 0.1.0 |
| **M1** | Journal nutritionnel manuel | 2–3 sem. | 0.2.0 |
| **M2** | Catalogue en ligne + scan | 3–4 sem. | 0.3.0 |
| **M3** | Recettes et repas enregistrés | 1–2 sem. | 0.4.0 |
| **M4** | Entraînement | 3–4 sem. | 0.5.0 |
| **M5** | Progression et statistiques | 2 sem. | 0.6.0 |
| **M6** | Données, finition, publication | 2–3 sem. | 1.0.0 |

Total : **14 à 20 semaines**. Un projet personnel dépasse presque toujours son estimation ; l'ordre des jalons garantit qu'une interruption laisse quand même un outil utilisable.

---

## M0 — Fondations

**Objectif : une app qui démarre sur le téléphone, avec la chaîne d'outils complète.**

- Projet Expo + TypeScript strict, structure de dossiers de l'[architecture](../architecture/overview.md).
- Expo Router, quatre onglets vides.
- SQLite + Drizzle, première migration, ouverture avec les bons PRAGMA.
- ESLint (frontières comprises) + Prettier + husky + lint-staged.
- Jest configuré, un test qui passe.
- GitHub Actions : lint + typecheck + test.
- Development build EAS installé sur l'appareil.
- Thème clair/sombre, jetons de design, i18n initialisé.

**Terminé quand :** l'app s'installe et s'ouvre sur le téléphone, la CI est verte, une migration s'applique au démarrage.

**Pièges :** le development build est plus long à mettre en place qu'il n'y paraît — le faire en tout premier, pas quand il bloquera.

---

## M1 — Journal nutritionnel manuel

**Objectif : compter ses calories, avec des aliments saisis à la main.**

[SPEC-001](../specs/SPEC-001-journal-nutritionnel.md) et [SPEC-003](../specs/SPEC-003-objectifs-et-macros.md).

- Tables `foods`, `diary_entries`, `nutrition_targets`, `user_profile`, `body_measurements`.
- Domaine nutrition : Mifflin-St Jeor, TDEE, macros, plancher de sécurité, snapshot.
- Création d'aliments personnels.
- Écran de journal : 4 repas, totaux, anneau de calories, barres de macros.
- Ajout, modification, suppression avec annulation.
- Navigation entre jours.
- Onboarding : objectifs calculés ou saisis.
- Suivi de l'eau.

**Terminé quand :** tu peux suivre une journée complète en saisissant tes aliments à la main.

**Le vrai test :** l'utiliser réellement pendant trois jours. Ce qui agace ici agacera dix fois plus plus tard.

---

## M2 — Catalogue en ligne et scan

**Objectif : ne plus jamais saisir un produit à la main.**

[SPEC-002](../specs/SPEC-002-catalogue-aliments.md).

- Type `CanonicalFood` et les deux mappers, très testés.
- Client Open Food Facts (User-Agent, délais, anti-rebond, annulation).
- Client USDA FoodData Central.
- Filtres qualité et rejets.
- Recherche locale FTS5 + triggers.
- Écran de recherche : Fréquents / Récents / Mes aliments / En ligne.
- Scan de code-barres (`expo-camera`), gestion de la permission.
- Portions nommées et mémorisation de la dernière portion utilisée.
- **Écran « Sources et licences »** (obligation ODbL).
- *(Optionnel, en fin de jalon)* pack de démarrage d'aliments courants.

**Terminé quand :** tu scannes un produit dans un supermarché et il s'ajoute à ton journal en moins de 10 secondes.

**Pièges :** c'est le jalon le plus risqué. Les données OFF sont sales, les API changent. Prévoir de la marge, et se rappeler que le repli local doit toujours fonctionner.

---

## M3 — Recettes et repas enregistrés

**Objectif : arrêter de ressaisir les mêmes plats.**

[SPEC-004](../specs/SPEC-004-recettes-et-repas.md).

- Tables `recipes`, `recipe_items`, `saved_meals`, `saved_meal_items`.
- Éditeur de recette, calcul par portion, poids après cuisson.
- Imbrication sur un niveau, détection des cycles.
- Repas enregistrés, capture depuis le journal.
- Copie d'un repas vers un autre jour.

**Terminé quand :** ton petit-déjeuner habituel s'enregistre en deux taps.

---

## M4 — Entraînement

**Objectif : remplacer le carnet papier.**

[SPEC-005](../specs/SPEC-005-seances-entrainement.md) et [SPEC-006](../specs/SPEC-006-programmes-et-exercices.md).

- Tables `exercises`, `routines`, `routine_days`, `routine_items`, `workout_sessions`, `workout_sets`, `personal_records`.
- Jeu de ~150 exercices intégrés (rédaction et vérification : c'est plus long qu'il n'y paraît).
- Bibliothèque : recherche, filtres, exercices personnels.
- Éditeur de programmes.
- Écran de séance en direct : pré-remplissage depuis la dernière fois, validation des séries, types de séries.
- Chrono de repos avec notification et fonctionnement en arrière-plan.
- Persistance continue de la séance active.
- Volume, 1RM estimé, détection des records.
- Historique des séances.

**Terminé quand :** tu fais une séance complète à la salle sans toucher à autre chose.

**Pièges :** le chrono en arrière-plan est le point technique le plus délicat (optimisations batterie agressives selon les constructeurs). Le traiter tôt dans le jalon, pas à la fin.

---

## M5 — Progression et statistiques

**Objectif : voir si ça marche.**

[SPEC-007](../specs/SPEC-007-progression-et-stats.md).

- Saisie des mesures corporelles.
- Choix de la bibliothèque de graphiques → **ADR à écrire**.
- Courbe de poids avec moyenne mobile sur 7 jours.
- Moyennes caloriques hebdomadaires, régularité de suivi.
- Volume et séries par groupe musculaire.
- Progression du 1RM estimé par exercice.
- Comparaison de périodes.
- Vue croisée nutrition × entraînement.
- Requêtes d'agrégation en SQL, avec mesure des performances.

**Terminé quand :** tu ouvres l'onglet Progression après trois mois d'usage et tu apprends quelque chose.

---

## M6 — Données, finition, publication

**Objectif : une v1 publiable et sûre.**

[SPEC-008](../specs/SPEC-008-donnees-et-vie-privee.md).

- Export ZIP (JSON + CSV + manifeste), import en remplacement et en fusion.
- Chiffrement optionnel de l'export → **ADR à écrire**.
- Sauvegarde automatique hebdomadaire avec rotation.
- Effacement total et partiel.
- Traductions complètes fr/en, unités impériales.
- Passe d'accessibilité complète.
- Passe de performance : démarrage à froid, écran de séance, statistiques.
- Politique de confidentialité, formulaire de sécurité des données, fiche Play Store.
- Test fermé sur Play Console.

**Terminé quand :** l'app est sur le Play Store et tes données sont sauvegardables.

**Pièges :** les contraintes de publication (période de test fermé, nombre de testeurs) évoluent régulièrement. **Les vérifier dès M5**, pas au moment de publier.

---

## Ce qui vient après la v1

Par ordre de valeur estimée :

1. **Sauvegarde et sync chiffrée** — c'est la vraie limite de la v1.
2. **iOS** — la stack le permet ; compter tout de même 2 à 3 semaines.
3. **Health Connect** — poids et activité depuis d'autres apps.
4. **Import MyFitnessPal / Strong** — pour ne pas perdre son historique en changeant d'app.
5. **Micronutriments détaillés**.
6. **Widgets et Wear OS**.

Le [backlog](backlog.md) contient le détail.

## Comment savoir qu'on dérive

Trois signaux à surveiller :

1. **Un jalon dépasse de plus de 50 % son estimation** → réduire le périmètre, pas allonger le délai.
2. **Une fonctionnalité non prévue apparaît en cours de jalon** → backlog, sans exception.
3. **L'app n'est plus utilisée quotidiennement pendant son propre développement** → signal le plus grave : quelque chose ne va pas dans le produit, et c'est le moment de comprendre quoi.
