# SPEC-007 — Mesures corporelles, progression et statistiques

**Statut :** Brouillon
**Jalon :** M5
**Dépend de :** SPEC-001, SPEC-005
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Répondre à la seule question qui compte au bout de trois mois : **est-ce que ça marche ?** En croisant ce qui est mangé et ce qui est soulevé, sur la même échelle de temps.

C'est le principal avantage face à deux applications séparées.

## 2. Hors périmètre

- Les photos de progression → backlog (stockage, chiffrement, sensibilité)
- Les prédictions et projections → backlog
- L'export de graphiques en image → backlog

## 3. Parcours utilisateur

Onglet Progression. En haut, un sélecteur de période (4 semaines / 3 mois / 6 mois / 1 an / tout). En dessous, des cartes empilées : poids, apport calorique, volume d'entraînement, records. Un tap sur une carte ouvre le détail avec le graphique en grand et les données brutes.

## 4. Règles métier

### Mesures corporelles

> **RG-1** — Mesures suivies : poids (kg), taux de masse grasse (%), tour de taille, hanches, poitrine, bras G/D, cuisses G/D, mollets G/D (cm). Toutes facultatives sauf le poids.

> **RG-2** — Une seule mesure par type et par jour. Une nouvelle saisie le même jour remplace la précédente.

> **RG-3** — Le poids affiché sur les courbes est une **moyenne mobile sur 7 jours**, avec les points bruts en arrière-plan. Le poids brut varie de ±2 kg selon l'hydratation ; afficher la courbe brute donne une lecture fausse et décourage.

> **RG-4** — Une moyenne mobile n'est calculée qu'à partir d'**au moins 3 pesées** dans la fenêtre. En dessous, on affiche les points bruts sans courbe lissée.

### Statistiques nutritionnelles

> **RG-5** — L'apport calorique est agrégé **par semaine** (moyenne des jours renseignés), pas par jour : c'est la moyenne hebdomadaire qui détermine l'évolution du poids.

> **RG-6** — Un jour sans aucune entrée est **exclu** des moyennes, jamais compté comme 0. Le nombre de jours renseignés est affiché à côté de chaque moyenne (« moyenne sur 5 jours / 7 »).

> **RG-7** — L'écart à l'objectif est calculé jour par jour puis moyenné, en utilisant l'objectif en vigueur à chaque date (RG-10 de SPEC-003).

> **RG-8** — La régularité de suivi (« 18 jours renseignés sur 30 ») est affichée. C'est l'indicateur qui prédit le mieux si l'app sera encore utilisée dans deux mois.

### Statistiques d'entraînement

> **RG-9** — Volume hebdomadaire = somme des `charge × reps` des séries comptabilisées (RG-7 de SPEC-005), décomposable par groupe musculaire via le muscle principal de l'exercice.

> **RG-10** — Le nombre de **séries par groupe musculaire et par semaine** est affiché : c'est l'indicateur de référence pour piloter le volume d'entraînement, plus parlant que le tonnage.

> **RG-11** — Pour un exercice donné, la courbe de progression affiche le **1RM estimé** (meilleure série de chaque séance, Epley, reps ≤ 12), avec la charge et les répétitions réelles au survol.

> **RG-12** — Types de records suivis par exercice : charge maximale, répétitions maximales à une charge donnée, volume maximal sur une séance, 1RM estimé maximal.

> **RG-13** — Une comparaison de périodes est proposée (« 4 dernières semaines vs les 4 précédentes ») avec la variation en pourcentage.

### Vue croisée

> **RG-14** — Un graphique combiné superpose, sur la même échelle de temps : poids lissé, moyenne calorique hebdomadaire, volume hebdomadaire. Les trois séries ont des axes distincts et un code visuel qui reste lisible en niveaux de gris.

> **RG-15** — Aucune interprétation automatique n'est affichée. L'app montre les données, elle ne dit pas « tu manges trop ». Les corrélations sur un seul individu ne justifient aucune conclusion causale.

## 5. Critères d'acceptation

```
CA-1  Saisie d'une pesée
  Étant donné  l'écran de progression
  Quand        j'enregistre 78,4 kg aujourd'hui
  Alors        le poids apparaît sur la courbe
  Et           le profil est mis à jour (RG-12 de SPEC-003)

CA-2  Remplacement dans la journée
  Étant donné  une pesée de 78,4 kg enregistrée ce matin
  Quand        j'enregistre 78,1 kg cet après-midi
  Alors        une seule mesure de poids existe pour aujourd'hui, à 78,1 kg

CA-3  Moyenne mobile
  Étant donné  30 pesées quotidiennes oscillant entre 77 et 79 kg avec une tendance baissière
  Quand        j'affiche la courbe de poids
  Alors        la courbe lissée sur 7 jours est monotone décroissante
  Et           les points bruts sont visibles en arrière-plan

CA-4  Trop peu de données
  Étant donné  seulement 2 pesées sur les 30 derniers jours
  Quand        j'affiche la courbe
  Alors        les 2 points sont affichés sans courbe lissée
  Et           un message indique qu'il faut plus de pesées pour dégager une tendance

CA-5  Moyenne calorique
  Étant donné  une semaine où 5 jours sont renseignés (2000, 2200, 1900, 2400, 2100)
  Quand        j'affiche la moyenne hebdomadaire
  Alors        elle vaut 2120 kcal
  Et           l'app précise « moyenne sur 5 jours / 7 »

CA-6  Séries par groupe musculaire
  Étant donné  une semaine avec 4 séances comptant 16 séries de pectoraux au total
  Quand        j'affiche les statistiques d'entraînement
  Alors        « Pectoraux : 16 séries » est affiché pour la semaine

CA-7  Progression sur un exercice
  Étant donné  10 séances de développé couché sur 3 mois
  Quand        j'ouvre la fiche de l'exercice
  Alors        la courbe de 1RM estimé affiche 10 points
  Et           chaque point indique la série réelle qui l'a produit

CA-8  Comparaison de périodes
  Étant donné  un volume de 42 000 kg sur les 4 dernières semaines
  Et           38 000 kg sur les 4 semaines précédentes
  Quand        j'affiche la comparaison
  Alors        « +10,5 % » est affiché

CA-9  Vue croisée
  Étant donné  3 mois de données nutrition et entraînement
  Quand        j'ouvre le graphique combiné
  Alors        les 3 séries sont affichées sur la même échelle de temps
  Et           aucun texte d'interprétation n'accompagne le graphique

CA-10 Absence de données
  Étant donné  une installation neuve
  Quand        j'ouvre l'onglet Progression
  Alors        un état vide explique quoi faire pour remplir chaque carte
  Et           aucun graphique vide ni valeur à zéro n'est affiché
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Une seule pesée au total | Point unique, pas de courbe, pas de variation calculée. |
| Trou de plusieurs semaines dans les données | Interruption visible de la courbe, pas d'interpolation. |
| Pesée aberrante (variation > 5 kg en un jour) | Enregistrée, mais exclue de la moyenne mobile et signalée comme atypique. |
| Période sélectionnée sans aucune séance | Carte en état vide, pas de division par zéro. |
| Comparaison où la période précédente est vide | Afficher « — » au lieu de « +∞ % ». |
| 2 ans d'historique quotidien | Agrégation en SQL, jamais en JavaScript sur toutes les lignes. Cible : < 300 ms. |
| Unités impériales | Conversion à l'affichage ; le stockage reste en kg/cm. |

## 7. Données

Tables : `body_measurements`, plus des lectures agrégées sur `diary_entries`, `workout_sets`, `workout_sessions`, `personal_records`.
Détails : [data-model.md](../architecture/data-model.md).

Les agrégats sont calculés par des requêtes SQL dédiées (`src/data/queries/stats/`), pas en chargeant les lignes en mémoire. Si les mesures montrent un dépassement du budget, envisager des vues matérialisées rafraîchies à l'écriture — pas avant.

## 8. Interface

Cartes empilées, chacune avec un titre, un chiffre clé, une variation, et un graphique compact. Le détail s'ouvre en plein écran.

Contraintes graphiques : lisible en thème clair et sombre, aucune information portée par la seule couleur, valeurs accessibles au lecteur d'écran sous forme de tableau alternatif.

## 9. Performance et accessibilité

- Ouverture de l'onglet Progression sur 1 an de données : **< 300 ms**.
- Changement de période : **< 200 ms**.
- Chaque graphique expose une table de données équivalente pour le lecteur d'écran.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Bibliothèque de graphiques : `victory-native` (Skia, performant) ou SVG maison ? Trancher au début de M5 et consigner en ADR.
- [ ] 2026-08-09 — Afficher une estimation du TDEE réel à partir de l'historique poids + calories ? *Utile et honnête si l'incertitude est affichée, mais à cadrer avec RG-15.*
