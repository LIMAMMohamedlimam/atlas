# SPEC-001 — Journal nutritionnel quotidien

**Statut :** Brouillon
**Jalon :** M1
**Dépend de :** SPEC-003 (objectifs)
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Permettre d'enregistrer ce qu'on mange dans la journée, réparti en repas, et de voir en permanence où on en est par rapport à ses objectifs caloriques et de macronutriments. C'est l'écran d'accueil de l'application et l'écran le plus utilisé — 5 à 10 fois par jour.

## 2. Hors périmètre

- La recherche et le scan d'aliments → [SPEC-002](SPEC-002-catalogue-aliments.md)
- Les recettes et repas enregistrés → [SPEC-004](SPEC-004-recettes-et-repas.md)
- Le calcul des objectifs → [SPEC-003](SPEC-003-objectifs-et-macros.md)
- Les graphiques historiques → [SPEC-007](SPEC-007-progression-et-stats.md)

## 3. Parcours utilisateur

L'utilisateur ouvre l'app sur le journal du jour. Il voit immédiatement ses calories restantes et ses trois macros. Il tape sur un créneau de repas, ajoute un ou plusieurs aliments, ajuste la quantité, valide. Le total se met à jour instantanément. En fin de journée il peut consulter n'importe quel jour passé en balayant vers la gauche ou la droite.

## 4. Règles métier

> **RG-1** — Le journal est organisé en 4 créneaux fixes : `breakfast`, `lunch`, `dinner`, `snack`. Les collations sont un créneau unique, pas un par prise.

> **RG-2** — Un jour de journal est identifié par une **date locale** au format `YYYY-MM-DD`, jamais par un timestamp. Un repas saisi à 23 h 50 appartient au jour local en cours, indépendamment du fuseau ou de l'heure UTC.

> **RG-3** — À l'enregistrement, l'entrée **fige une copie** des valeurs nutritionnelles de l'aliment (`kcal`, protéines, glucides, lipides, et les micros suivis). Une modification ultérieure de la fiche produit ne modifie jamais l'historique. Voir [ADR-0005](../adr/0005-snapshot-nutritionnel.md).

> **RG-4** — Toute entrée stocke la quantité telle que saisie (`quantity` + `unit`, ex. `2` + `slice`) **et** son équivalent résolu en grammes (`grams`). Les totaux se calculent toujours depuis `grams`.

> **RG-5** — Les totaux du jour sont la somme des entrées non supprimées de ce jour. Une entrée supprimée est marquée `deleted_at`, jamais effacée physiquement (permet l'annulation et une future synchronisation).

> **RG-6** — Les calories affichées sont celles fournies par la source, **pas** recalculées depuis les macros. Si la source ne fournit pas de calories mais fournit les macros, on les calcule via 4/4/9 kcal par gramme (P/G/L) et on marque la valeur comme estimée.

> **RG-7** — Les valeurs manquantes restent `null` et s'affichent « — ». Elles ne comptent pas comme 0 dans les moyennes, mais comptent comme 0 dans le total du jour, avec une mention « données incomplètes » si au moins une entrée du jour a des macros manquantes.

> **RG-8** — L'objectif appliqué à un jour est celui en vigueur **à cette date** (les objectifs sont historisés). Changer son objectif aujourd'hui ne réécrit pas les jours passés.

> **RG-9** — La navigation entre jours est illimitée dans le passé, et limitée au **jour même** dans le futur (pas de saisie anticipée en v1).

> **RG-10** — L'eau bue est suivie séparément des aliments, en millilitres, avec des incréments configurables (par défaut 250 ml).

## 5. Critères d'acceptation

```
CA-1  Affichage du jour
  Étant donné  un journal vide pour aujourd'hui et un objectif de 2400 kcal
  Quand        j'ouvre l'application
  Alors        l'écran Journal affiche la date du jour, « 2400 restantes »,
               et les 4 créneaux de repas vides

CA-2  Ajout d'une entrée
  Étant donné  un aliment « Riz basmati cuit » à 130 kcal / 100 g
  Quand        j'ajoute 150 g au déjeuner
  Alors        l'entrée apparaît sous « Déjeuner » avec 195 kcal
  Et           le total du jour augmente de 195 kcal
  Et           les macros du jour augmentent proportionnellement

CA-3  Figement des valeurs
  Étant donné  une entrée créée à partir d'un aliment à 130 kcal / 100 g
  Quand        je modifie ensuite cet aliment pour le passer à 200 kcal / 100 g
  Alors        l'entrée déjà enregistrée affiche toujours 195 kcal
  Et           une nouvelle entrée de 150 g afficherait 300 kcal

CA-4  Modification de quantité
  Étant donné  une entrée de 150 g de riz
  Quand        je la modifie à 200 g
  Alors        ses calories passent à 260 kcal et le total du jour se met à jour

CA-5  Suppression et annulation
  Étant donné  une entrée dans le journal
  Quand        je la supprime
  Alors        elle disparaît de la liste et un message « Annuler » s'affiche 5 secondes
  Et           un tap sur « Annuler » la restaure à l'identique

CA-6  Frontière de journée
  Étant donné  qu'il est 23 h 50 le 9 août, fuseau Europe/Paris
  Quand        j'enregistre un aliment
  Alors        il est rattaché au journal du 2026-08-09
  Et           il y reste après un changement de fuseau horaire de l'appareil

CA-7  Navigation entre jours
  Étant donné  que je consulte le journal d'aujourd'hui
  Quand        je balaye vers la droite
  Alors        j'affiche le journal d'hier avec ses totaux et l'objectif en vigueur ce jour-là
  Et           je ne peux pas naviguer au-delà d'aujourd'hui

CA-8  Copie d'un repas
  Étant donné  un déjeuner de 3 aliments enregistré hier
  Quand        je choisis « Copier vers » → aujourd'hui → Déjeuner
  Alors        3 nouvelles entrées sont créées aujourd'hui avec les mêmes quantités
  Et           les entrées d'hier sont inchangées

CA-9  Dépassement d'objectif
  Étant donné  un objectif de 2400 kcal et 2600 kcal consommées
  Quand        je consulte le journal
  Alors        l'indicateur affiche « 200 au-dessus » avec un traitement visuel distinct
  Et           aucun message culpabilisant n'est affiché

CA-10 Fonctionnement hors ligne
  Étant donné  l'appareil en mode avion
  Quand        j'ajoute, modifie et supprime des entrées à partir d'aliments déjà en base
  Alors        toutes les opérations réussissent sans erreur ni indicateur de chargement
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Quantité saisie = 0 | Refuser la validation, message « La quantité doit être supérieure à 0 ». |
| Quantité > 10 000 g | Accepter mais demander confirmation (« 12 kg de riz, c'est bien ça ? »). |
| Aliment sans calories ni macros | Interdire l'ajout au journal ; proposer de compléter la fiche. |
| Aliment supprimé du catalogue alors qu'il est utilisé dans l'historique | L'historique reste intact grâce au figement (RG-3). L'entrée affiche le nom figé. |
| Changement d'heure (heure d'été) | Aucun impact : la clé est une date locale, pas une durée. |
| Appareil dont la date est modifiée manuellement | On fait confiance à l'horloge de l'appareil. Pas de correction. |
| Plus de 100 entrées sur une journée | La liste reste fluide (liste virtualisée). |
| Base corrompue au démarrage | Écran d'erreur avec proposition d'export brut et de réinitialisation. Jamais de crash silencieux. |

## 7. Données

Tables : `diary_entries`, `water_logs`, `foods`, `nutrition_targets`.
Schéma détaillé : [data-model.md](../architecture/data-model.md#nutrition).

Points d'attention :
- Index composite `(day, meal_slot)` sur `diary_entries` — c'est la requête la plus fréquente de l'app.
- Les totaux du jour sont **calculés**, jamais stockés, tant que les mesures de performance ne montrent pas de problème.

## 8. Interface

```
┌─────────────────────────────────┐
│  ‹   mardi 9 août        aujourd'hui  │
├─────────────────────────────────┤
│         ╭───────────╮           │
│         │   1 240   │  restantes│
│         │   /2400   │           │
│         ╰───────────╯           │
│  P ████████░░ 98/180 g          │
│  G ██████░░░░ 145/260 g         │
│  L ███████░░░ 42/70 g           │
├─────────────────────────────────┤
│  Petit-déjeuner          420 kcal│
│   • Flocons d'avoine 80 g   304 │
│   • Lait demi-écrémé 200 ml 116 │
│   + Ajouter                     │
├─────────────────────────────────┤
│  Déjeuner                740 kcal│
│   ...                           │
├─────────────────────────────────┤
│  Dîner                     — kcal│
│   + Ajouter                     │
├─────────────────────────────────┤
│  Collations                — kcal│
│   + Ajouter                     │
├─────────────────────────────────┤
│  Eau   💧💧💧💧░░  1000 / 2000 ml │
└─────────────────────────────────┘
```

États à traiter : journal vide (message d'accueil, pas un écran blanc), aucun objectif défini (inviter à le configurer, mais laisser saisir), jour futur (bloqué).

Interactions : balayage horizontal entre jours ; balayage vers la gauche sur une entrée pour supprimer ; appui long pour copier vers un autre jour/repas.

## 9. Performance et accessibilité

- Affichage du journal du jour : **< 100 ms** après le montage de l'écran, en lecture locale.
- Mise à jour des totaux après ajout : **< 50 ms**, sans indicateur de chargement.
- Cibles tactiles ≥ 48 dp.
- L'anneau de calories est doublé d'un texte lisible par un lecteur d'écran (« 1240 calories restantes sur 2400 »).
- L'information « au-dessus de l'objectif » ne repose pas uniquement sur la couleur.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Faut-il permettre de renommer ou d'ajouter des créneaux de repas ? *Proposition : non en v1, RG-1 fige les 4 créneaux.*
- [ ] 2026-08-09 — Afficher les fibres et le sel dans le résumé du jour, ou seulement dans le détail ?
