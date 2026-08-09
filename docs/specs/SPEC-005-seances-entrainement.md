# SPEC-005 — Séance d'entraînement en direct

**Statut :** Brouillon
**Jalon :** M4
**Dépend de :** SPEC-006 (exercices et programmes)
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Remplacer le carnet papier pendant la séance. L'utilisateur enchaîne ses exercices, coche ses séries, et l'app enregistre tout sans jamais le ralentir. Le chrono de repos démarre seul.

C'est un écran utilisé **avec les mains occupées, moites, dans le bruit, en 60 secondes de repos**. Toute complexité d'interface est un échec.

## 2. Hors périmètre

- La création des exercices et des programmes → [SPEC-006](SPEC-006-programmes-et-exercices.md)
- Les graphiques de progression → [SPEC-007](SPEC-007-progression-et-stats.md)
- La progression automatique des charges → backlog

## 3. Parcours utilisateur

Onglet Entraînement → « Commencer une séance » → choisir une séance du programme, ou partir d'une séance vide. L'app affiche les exercices prévus, chacun avec ses séries, **pré-remplies avec les charges et répétitions de la dernière fois**. Pour chaque série effectuée : ajuster si besoin, cocher. Le chrono de repos démarre. À la fin : « Terminer la séance », résumé, enregistrement.

## 4. Règles métier

### Cycle de vie de la séance

> **RG-1** — Une seule séance active à la fois. Si une séance active existe déjà, l'app propose de la reprendre ou de l'abandonner.

> **RG-2** — La séance est **persistée en base à chaque modification**, pas seulement à la fin. Si l'app est tuée par le système en pleine séance, on reprend exactement là où on en était.

> **RG-3** — Une séance active affiche une **notification permanente** avec le chrono total, pour revenir en un tap et éviter que le système ne la termine.

> **RG-4** — Une séance abandonnée sans aucune série cochée est supprimée. Avec au moins une série cochée, l'app demande confirmation avant suppression.

> **RG-5** — La durée de la séance est calculée entre `started_at` et `ended_at`. Une fonction « Pause » suspend le décompte (`paused_duration_s`).

> **RG-6** — Une séance passée peut être modifiée ou créée a posteriori (« j'ai oublié de noter mardi »), avec date et heure ajustables.

### Séries

> **RG-7** — Types de séries : `warmup`, `normal`, `dropset`, `failure`. Seules les séries `normal` et `failure` comptent dans le volume et les records.

> **RG-8** — Selon le type d'exercice, les champs saisis diffèrent :
>
> | Type d'exercice | Champs |
> |---|---|
> | `weight_reps` | charge + répétitions |
> | `bodyweight_reps` | répétitions (+ lest optionnel) |
> | `weighted_bodyweight` | lest + répétitions |
> | `duration` | durée |
> | `duration_distance` | durée + distance |
> | `reps_only` | répétitions |

> **RG-9** — Les valeurs par défaut d'une série viennent de **la même série du même exercice lors de la dernière séance où il a été effectué**. À défaut, de la cible du programme. À défaut, vide.

> **RG-10** — Cocher une série la marque `completed_at` et démarre le chrono de repos. Décocher annule le chrono.

> **RG-11** — Le volume d'une série `weight_reps` = `charge × répétitions`. Le volume de la séance = somme des séries comptabilisées (RG-7). Pour le poids du corps, le poids corporel courant est utilisé comme charge, avec une mention explicite que c'est une estimation.

> **RG-12** — Le 1RM estimé utilise **Epley** : `charge × (1 + reps / 30)`, uniquement pour `reps ≤ 12`. Au-delà, l'estimation n'est pas affichée — elle n'est pas fiable.

> **RG-13** — Le RPE est facultatif, sur une échelle de 6 à 10 par pas de 0,5. Il n'entre dans aucun calcul en v1, il est juste enregistré.

### Chrono de repos

> **RG-14** — Durée par défaut définie par exercice dans le programme, sinon 120 s. Modifiable à la volée pendant la séance sans changer le réglage du programme.

> **RG-15** — À l'expiration : notification + vibration + son court. Le chrono continue en négatif (« +0:23 ») pour savoir de combien on a dépassé.

> **RG-16** — Le chrono fonctionne app en arrière-plan et écran verrouillé.

### Superséries

> **RG-17** — Deux exercices ou plus peuvent être groupés en supersérie. L'app enchaîne alors les exercices du groupe avant de déclencher le repos.

## 5. Critères d'acceptation

```
CA-1  Démarrage depuis un programme
  Étant donné  un programme « PPL » avec une séance « Push » de 5 exercices
  Quand        je démarre cette séance
  Alors        les 5 exercices s'affichent avec leurs séries cibles
  Et           chaque série est pré-remplie avec les valeurs de ma dernière séance Push

CA-2  Validation d'une série
  Étant donné  une série de développé couché à 80 kg × 8
  Quand        je coche la série
  Alors        elle est marquée effectuée et horodatée
  Et           le chrono de repos démarre à la durée configurée
  Et           la série suivante devient la série active

CA-3  Persistance après fermeture forcée
  Étant donné  une séance en cours avec 6 séries cochées
  Quand        le système tue l'application et que je la rouvre
  Alors        la séance reprend avec les 6 séries cochées
  Et           le chrono total reflète le temps réellement écoulé

CA-4  Chrono en arrière-plan
  Étant donné  un chrono de repos de 120 s démarré
  Quand        je verrouille l'écran et attends 120 s
  Alors        je reçois une notification et une vibration
  Et           en revenant dans l'app le chrono affiche le dépassement

CA-5  Calcul du volume
  Étant donné  une séance avec : échauffement 40 kg × 10, puis 80×8, 80×8, 75×6
  Quand        je termine la séance
  Alors        le volume total affiché est 1730 kg (l'échauffement est exclu)

CA-6  1RM estimé
  Étant donné  une série de 100 kg × 5
  Quand        la série est validée
  Alors        le 1RM estimé calculé est 116,7 kg
  Et           pour une série de 100 kg × 20, aucun 1RM n'est affiché

CA-7  Record personnel
  Étant donné  un meilleur 1RM estimé de 110 kg au développé couché
  Quand        j'enregistre une série de 100 kg × 5 (soit 116,7 kg)
  Alors        un indicateur de record apparaît sur la série
  Et           le record est enregistré avec sa date et la séance d'origine

CA-8  Ajout d'un exercice en cours de séance
  Étant donné  une séance en cours
  Quand        j'ajoute un exercice non prévu au programme
  Alors        il s'ajoute en fin de séance avec une série vide
  Et           le programme d'origine n'est pas modifié

CA-9  Séance rétroactive
  Étant donné  aucune séance active
  Quand        je crée une séance datée d'avant-hier avec 3 exercices
  Alors        elle apparaît dans l'historique à la bonne date
  Et           elle compte dans les statistiques de la semaine correspondante

CA-10 Abandon
  Étant donné  une séance en cours avec 2 séries cochées
  Quand        je choisis « Abandonner »
  Alors        une confirmation est demandée
  Et           après confirmation aucune trace ne subsiste dans l'historique

CA-11 Fonctionnement hors ligne
  Étant donné  l'appareil en mode avion
  Quand        je réalise une séance complète
  Alors        tout fonctionne à l'identique, chrono et notifications compris
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Charge saisie = 0 | Autorisé (exercice à vide, barre seule à préciser). |
| Répétitions = 0 sur une série cochée | Refusé : décocher la série ou saisir un nombre. |
| Charge > 500 kg | Confirmation demandée (faute de frappe probable). |
| Séance de plus de 6 h | À l'ouverture, proposer « Vous avez oublié de terminer votre séance ? » avec l'heure de la dernière série comme fin proposée. |
| Notifications refusées par l'utilisateur | Le chrono fonctionne quand même à l'écran ; expliquer une fois ce qui est perdu. |
| Exercice supprimé après avoir été utilisé | L'historique reste intact (référence conservée + nom figé). |
| Batterie faible / optimisation agressive du constructeur | Documenter la limite ; proposer d'exclure l'app de l'optimisation batterie au premier chrono manqué. `[À VÉRIFIER : comportement Xiaomi/Huawei]` |

## 7. Données

Tables : `workout_sessions`, `workout_sets`, `personal_records`, `exercises`.
Détails : [data-model.md](../architecture/data-model.md#entraînement).

L'état de la séance active vit **en base**, pas seulement en mémoire (RG-2). Le store en mémoire n'est qu'un cache de lecture.

## 8. Interface

```
┌─────────────────────────────────┐
│ Push A            42:15    ⏸ ⋮  │
├─────────────────────────────────┤
│ ⏱  Repos   1:23         +30s ✕ │  ← barre visible seulement pendant le repos
├─────────────────────────────────┤
│ Développé couché                │
│      kg      reps            ✓  │
│  1   80      8      (80×8)   ☑  │
│  2   80      8      (80×8)   ☑  │
│  3   80  ▸   6  ▸   (80×6)   ☐  │  ← série active
│  + Ajouter une série            │
├─────────────────────────────────┤
│ Développé incliné haltères      │
│  ...                            │
├─────────────────────────────────┤
│      [ Terminer la séance ]     │
└─────────────────────────────────┘
```

Entre parenthèses : la performance de la dernière fois, comme référence.

Contraintes d'interaction : tout accessible au pouce, cases à cocher ≥ 48 dp, clavier numérique dédié, pas de boîte de dialogue modale pendant la séance.

## 9. Performance et accessibilité

- Cocher une série : retour visuel en **< 16 ms** (une frame), écriture en base en asynchrone.
- Écran de séance avec 12 exercices × 5 séries : défilement à 60 fps.
- Le chrono ne dérive pas : il se recale sur l'horloge système, pas sur un compteur d'intervalles.
- Vibration et son sont des retours **redondants**, pas alternatifs : l'un ou l'autre peut être coupé.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Garder l'écran allumé pendant une séance ? *Proposition : oui, option activée par défaut, désactivable.*
- [ ] 2026-08-09 — Le poids corporel utilisé pour le volume des tractions doit-il être celui du jour ou le dernier connu ? *Proposition : le dernier connu à la date de la séance.*
