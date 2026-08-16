# SPEC-003 — Profil, objectifs caloriques et macronutriments

**Statut :** Brouillon
**Jalon :** M1
**Dépend de :** —
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Définir combien l'utilisateur doit manger chaque jour : soit en saisissant directement ses chiffres (utilisateur averti), soit via un calcul assisté à partir de son profil. Ces objectifs servent de référence à tout le reste de l'app.

## 2. Hors périmètre

- L'affichage quotidien des objectifs → [SPEC-001](SPEC-001-journal-nutritionnel.md)
- Le suivi du poids dans le temps → [SPEC-007](SPEC-007-progression-et-stats.md)
- Les objectifs variables selon les jours (jours d'entraînement vs repos) → backlog

## 3. Parcours utilisateur

À la première ouverture, un court onboarding propose deux chemins : « Je connais mes chiffres » (saisie directe en un écran) ou « Aide-moi à les calculer » (âge, sexe, taille, poids, niveau d'activité, objectif). Dans les deux cas, l'utilisateur arrive sur un récapitulatif modifiable avant validation. Il peut changer ses objectifs à tout moment dans les paramètres.

## 4. Règles métier

### Calcul

> **RG-1** — Le métabolisme de base (BMR) est calculé par **Mifflin-St Jeor** :
> - homme : `10 × poids(kg) + 6,25 × taille(cm) − 5 × âge + 5`
> - femme : `10 × poids(kg) + 6,25 × taille(cm) − 5 × âge − 161`
>
> Une option « Je préfère ne pas répondre » utilise la moyenne des deux formules, avec un avertissement sur la moindre précision.

> **RG-2** — Le besoin total (TDEE) = `BMR × facteur d'activité` :
>
> | Niveau | Facteur |
> |---|---|
> | Sédentaire | 1,2 |
> | Légèrement actif (1-3 séances/sem.) | 1,375 |
> | Modérément actif (3-5) | 1,55 |
> | Très actif (6-7) | 1,725 |
> | Extrêmement actif (physique + sport) | 1,9 |

> **RG-3** — L'objectif calorique = TDEE + ajustement selon le but :
>
> | But | Ajustement |
> |---|---|
> | Perte lente | −15 % |
> | Perte modérée | −20 % |
> | Maintien | 0 |
> | Prise lente | +10 % |
> | Prise modérée | +15 % |
>
> On raisonne en pourcentage, pas en calories fixes : un déficit de 500 kcal n'a pas le même sens à 1600 et à 3200 kcal de TDEE.

> **RG-4 — Plancher de sécurité (règle critique).** Si l'objectif calculé descend sous **1500 kcal (homme) / 1200 kcal (femme)**, l'app affiche un avertissement explicite recommandant de consulter un professionnel, et **plafonne le déficit proposé** pour ne pas passer sous ce seuil. L'utilisateur peut forcer une valeur inférieure en saisie manuelle, mais seulement après une confirmation dédiée. `[À VÉRIFIER : formuler l'avertissement avec un texte relu, sans injonction ni jugement]`

> **RG-5** — L'onboarding n'est pas proposé aux moins de 16 ans : si l'âge saisi est inférieur, le calcul assisté est désactivé et seule la saisie manuelle reste disponible, accompagnée d'un message invitant à en parler à un adulte ou à un professionnel de santé.

### Macronutriments

> **RG-6** — Les protéines sont calculées **par kilo de poids corporel**, pas en pourcentage des calories : c'est la pratique de référence en musculation.
> Défaut : `1,8 g/kg` en maintien et en prise, `2,2 g/kg` en perte (préservation de la masse maigre).

> **RG-7** — Les lipides : `25 %` des calories totales par défaut, avec un plancher de `0,8 g/kg`.

> **RG-8** — Les glucides absorbent le reste : `(kcal − protéines×4 − lipides×9) / 4`.

> **RG-9** — L'utilisateur peut passer en mode manuel et fixer ses trois macros. Dans ce mode, la somme `P×4 + G×4 + L×9` doit correspondre à l'objectif calorique à **±2 %** près, sinon l'app propose d'ajuster automatiquement les glucides.

### Historisation

> **RG-10** — Les objectifs sont **historisés** : chaque modification crée un nouvel enregistrement avec une date d'effet. Le journal d'un jour donné utilise l'objectif en vigueur ce jour-là. Les objectifs passés ne sont jamais réécrits.

> **RG-11** — Un changement d'objectif prend effet **le jour même**, jamais rétroactivement.

> **RG-12** — Le poids saisi dans le profil et le poids du suivi corporel sont la **même donnée** (table `body_measurements`). Enregistrer une pesée met à jour le profil ; l'app propose alors de recalculer les objectifs, sans jamais le faire d'office.

## 5. Critères d'acceptation

```
CA-1  Calcul assisté
  Étant donné  homme, 30 ans, 180 cm, 80 kg, modérément actif, maintien
  Quand        je lance le calcul
  Alors        le BMR affiché est 1780 kcal
  Et           le TDEE affiché est 2759 kcal
  Et           l'objectif proposé est 2759 kcal

CA-2  Répartition des macros par défaut
  Étant donné  un objectif de 2760 kcal, 80 kg, but maintien
  Quand        les macros par défaut sont calculées
  Alors        protéines = 144 g (1,8 × 80)
  Et           lipides = 77 g (25 % de 2760 / 9)
  Et           glucides = 373 g (le reste : (2760 − 576 − 693) / 4)

CA-3  Plancher de sécurité
  Étant donné  un profil femme dont le TDEE calculé est 1400 kcal
  Et           un but « perte modérée » (−20 %)
  Quand        l'objectif est calculé
  Alors        la valeur brute serait 1120 kcal
  Et           l'app affiche un avertissement de sécurité
  Et           l'objectif proposé est relevé à 1200 kcal (plancher applicable)

CA-4  Forçage manuel sous le plancher
  Étant donné  l'avertissement de sécurité affiché
  Quand        je saisis manuellement 1100 kcal et confirme dans la boîte de dialogue dédiée
  Alors        l'objectif est enregistré à 1100 kcal
  Et           un rappel discret reste visible dans les paramètres

CA-5  Cohérence en mode manuel
  Étant donné  un objectif de 2400 kcal
  Quand        je saisis P=180 G=200 L=60 (soit 2060 kcal)
  Alors        l'app signale l'écart de 340 kcal
  Et           propose de porter les glucides à 285 g

CA-6  Historisation
  Étant donné  un objectif de 2400 kcal en vigueur depuis le 1er juillet
  Quand        je le passe à 2700 kcal aujourd'hui
  Alors        le journal d'aujourd'hui affiche 2700
  Et           le journal du 15 juillet affiche toujours 2400

CA-7  Saisie directe sans profil
  Étant donné  un nouvel utilisateur choisissant « Je connais mes chiffres »
  Quand        je saisis 2500 kcal, 190 P, 250 G, 70 L
  Alors        les objectifs sont enregistrés
  Et           aucune donnée de profil (âge, sexe, taille) n'est demandée ni stockée

CA-8  Mise à jour du poids
  Étant donné  un profil à 80 kg et des objectifs calculés
  Quand        j'enregistre une pesée à 78 kg
  Alors        le profil affiche 78 kg
  Et           l'app propose de recalculer les objectifs sans les modifier automatiquement
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Poids ou taille hors bornes plausibles (< 30 kg, > 300 kg, < 100 cm, > 250 cm) | Refus de la saisie avec message clair. |
| Âge < 16 ans | Calcul assisté désactivé (RG-5). |
| Aucun objectif défini | Le journal fonctionne, l'anneau affiche « Objectif non défini » avec un lien vers la configuration. |
| Objectif à 0 ou négatif | Refusé. |
| Macros manuelles à 0 g de protéines | Autorisé mais avertissement. |
| Unités impériales | Conversion à l'affichage uniquement ; le stockage reste en kg/cm. |

## 7. Données

Tables : `user_profile` (une seule ligne), `nutrition_targets` (historisée), `body_measurements`.
Détails : [data-model.md](../architecture/data-model.md#profil-et-objectifs).

Formules : implémentées dans `src/domain/nutrition/energy.ts`, testées avec des valeurs de référence documentées.

## 8. Interface

Onboarding en 3 écrans maximum, saut possible à tout moment. Écran récapitulatif avant validation, affichant le calcul intermédiaire (BMR, TDEE, ajustement) — l'utilisateur doit comprendre d'où sortent les chiffres, pas les subir.

Dans les paramètres : un écran « Objectifs » avec bascule « Calculé / Manuel ».

## 9. Performance et accessibilité

- Calcul instantané, sans latence perceptible.
- Les avertissements de sécurité doivent être lisibles par un lecteur d'écran et ne pas dépendre uniquement d'une couleur.
- Le champ « sexe » est utilisé uniquement comme paramètre de la formule ; le libellé doit le dire, et l'option « Je préfère ne pas répondre » doit être aussi accessible que les autres.

## 10. Questions ouvertes

- [x] 2026-08-09 — Proposer Katch-McArdle (basée sur la masse maigre) pour les utilisateurs qui connaissent leur taux de masse grasse ? → **Non en v1** (décidé le 2026-08-16) : un deuxième mode de calcul à maintenir pour un gain limité à une minorité d'utilisateurs. Reporté au backlog.
- [ ] 2026-08-16 — **Quel plancher de sécurité pour `sex = 'unspecified'` ?** RG-4 fixe 1500 kcal (homme) et 1200 (femme) mais ne dit rien du troisième cas. L'implémentation retient **1350 kcal**, la moyenne des deux, par cohérence avec RG-1 qui moyenne déjà les deux formules dans ce cas. À confirmer lors de la relecture des textes de sécurité.
- [ ] 2026-08-09 — Faire relire le texte des avertissements de sécurité par une source compétente avant publication.
