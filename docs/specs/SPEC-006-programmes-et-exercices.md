# SPEC-006 — Bibliothèque d'exercices et programmes

**Statut :** Brouillon
**Jalon :** M4
**Dépend de :** —
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Fournir le référentiel sur lequel s'appuient les séances : une bibliothèque d'exercices utilisable dès l'installation, et des programmes (routines) que l'utilisateur construit une fois et rejoue chaque semaine.

## 2. Hors périmètre

- Le déroulé d'une séance → [SPEC-005](SPEC-005-seances-entrainement.md)
- Les programmes générés automatiquement, la périodisation → backlog
- Les vidéos de démonstration → backlog (poids de l'APK, droits)

## 3. Parcours utilisateur

À l'installation, ~150 exercices courants sont déjà présents, cherchables par nom ou filtrables par groupe musculaire et par matériel. L'utilisateur crée un programme « PPL », y ajoute trois séances types, et dans chacune la liste des exercices avec séries et répétitions cibles. Il peut aussi créer ses propres exercices.

## 4. Règles métier

### Exercices

> **RG-1** — Un exercice porte : nom, type de mesure (voir RG-8 de SPEC-005), muscle principal, muscles secondaires, matériel, et des instructions textuelles courtes.

> **RG-2** — Groupes musculaires du référentiel : `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `quads`, `hamstrings`, `glutes`, `calves`, `abs`, `traps`, `full_body`, `cardio`.

> **RG-3** — Matériel : `barbell`, `dumbbell`, `machine`, `cable`, `bodyweight`, `kettlebell`, `band`, `other`.

> **RG-4** — Les exercices pré-installés sont marqués `is_builtin = 1`. Ils ne sont ni modifiables ni supprimables, mais peuvent être **masqués** de la recherche et **dupliqués** pour créer une variante personnelle.

> **RG-5** — Les exercices personnels sont librement modifiables. Leur suppression est logique et n'affecte pas l'historique des séances.

> **RG-6** — La bibliothèque intégrée est livrée comme **données versionnées** (fichier JSON appliqué par une migration), pas en dur dans le code. Une mise à jour de l'app peut ajouter des exercices sans écraser les personnalisations de l'utilisateur.

> **RG-7** — Le référentiel est en anglais dans les identifiants (`bench_press`) et traduit à l'affichage. `[À VÉRIFIER : couverture de la traduction française des 150 exercices]`

### Programmes

> **RG-8** — Un programme contient 1 à 14 séances types ordonnées. Une séance type contient 1 à 30 exercices ordonnés.

> **RG-9** — Chaque exercice d'une séance type porte des cibles facultatives : nombre de séries, fourchette de répétitions (`8-12`), RPE cible, durée de repos, note.

> **RG-10** — Les exercices d'une séance type peuvent être groupés en supersérie via un identifiant de groupe partagé. L'ordre à l'intérieur du groupe est respecté.

> **RG-11** — Modifier un programme n'affecte **aucune** séance déjà réalisée. Une séance passée conserve la structure qu'elle avait au moment de son exécution.

> **RG-12** — Un programme peut être dupliqué (base d'un nouveau cycle) et archivé (masqué sans perte d'historique).

> **RG-13** — Aucun programme n'est obligatoire : on peut démarrer une séance vide et ajouter des exercices au fil de l'eau.

## 5. Critères d'acceptation

```
CA-1  Bibliothèque disponible à l'installation
  Étant donné  une installation neuve, appareil hors ligne
  Quand        j'ouvre la bibliothèque d'exercices
  Alors        au moins 150 exercices sont disponibles
  Et           chacun a un muscle principal et un type de matériel renseignés

CA-2  Recherche et filtres
  Étant donné  la bibliothèque complète
  Quand        je filtre sur « dos » + « barre »
  Alors        seuls les exercices de dos à la barre sont listés
  Et           le résultat s'affiche en moins de 100 ms

CA-3  Exercice personnel
  Étant donné  le formulaire de création
  Quand        je crée « Tirage poulie prise neutre », dos, poulie, charge+reps
  Alors        il apparaît dans la bibliothèque avec un marqueur « perso »
  Et           il est utilisable immédiatement dans une séance

CA-4  Exercice intégré non modifiable
  Étant donné  l'exercice intégré « Développé couché »
  Quand        j'ouvre sa fiche
  Alors        les champs sont en lecture seule
  Et           les actions « Dupliquer » et « Masquer » sont proposées

CA-5  Création d'un programme
  Étant donné  la bibliothèque d'exercices
  Quand        je crée un programme « PPL » avec 3 séances types de 6 exercices chacune
  Alors        le programme est enregistré
  Et           chaque séance type est démarrable depuis l'onglet Entraînement

CA-6  Cibles par exercice
  Étant donné  une séance type « Push »
  Quand        je fixe « Développé couché : 4 séries, 6-8 reps, repos 180 s »
  Et           que je démarre cette séance
  Alors        4 séries vides sont pré-créées
  Et           la fourchette 6-8 est affichée comme repère
  Et           le chrono de repos est réglé à 180 s

CA-7  Modification sans effet rétroactif
  Étant donné  une séance « Push » réalisée la semaine dernière avec 6 exercices
  Quand        je retire un exercice de la séance type
  Alors        la séance passée affiche toujours ses 6 exercices

CA-8  Supersérie
  Étant donné  une séance type où les exercices 3 et 4 sont dans le même groupe
  Quand        je démarre la séance
  Alors        ils sont affichés visuellement liés
  Et           le repos ne se déclenche qu'après la série du second exercice

CA-9  Séance vide
  Étant donné  aucun programme créé
  Quand        je démarre une séance vide et ajoute 3 exercices
  Alors        la séance se déroule normalement
  Et           elle apparaît dans l'historique sans être rattachée à un programme
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Nom d'exercice personnel identique à un exercice intégré | Autorisé, les deux coexistent avec un marqueur de provenance. |
| Programme sans aucune séance type | Enregistré comme brouillon, non démarrable. |
| Exercice masqué mais présent dans un programme | Reste utilisable dans ce programme ; il n'apparaît simplement plus dans la recherche. |
| Suppression d'un exercice personnel utilisé dans un programme | Confirmation demandée, avec la liste des programmes concernés. |
| Mise à jour de l'app modifiant un exercice intégré déjà utilisé | Les modifications s'appliquent à la fiche, pas à l'historique (nom figé dans les séances). |
| Plus de 30 exercices dans une séance type | Refusé avec message. |

## 7. Données

Tables : `exercises`, `routines`, `routine_days`, `routine_items`.
Détails : [data-model.md](../architecture/data-model.md#entraînement).

Le jeu d'exercices intégré vit dans `assets/seed/exercises.v1.json`, appliqué par une migration idempotente identifiée par version.

## 8. Interface

Bibliothèque : liste alphabétique avec en-têtes de section, barre de recherche, puce de filtres (muscle, matériel, perso/intégré).

Éditeur de programme : liste de séances types réordonnables par glisser-déposer, chacune ouvrant la liste de ses exercices, également réordonnables.

## 9. Performance et accessibilité

- Recherche dans 150 à 500 exercices : **< 100 ms**.
- Glisser-déposer accessible : proposer aussi « Monter / Descendre » dans le menu contextuel, car le glisser-déposer est inutilisable au lecteur d'écran.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Source du jeu d'exercices intégré : rédaction maison ou reprise d'un jeu open source (vérifier la licence) ? *La rédaction maison évite tout risque juridique et garantit la cohérence des noms français.*
- [ ] 2026-08-09 — Illustrations : schémas SVG maison, ou aucun visuel en v1 ?
