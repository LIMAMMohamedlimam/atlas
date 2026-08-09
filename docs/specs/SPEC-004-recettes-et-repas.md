# SPEC-004 — Recettes et repas enregistrés

**Statut :** Brouillon
**Jalon :** M3
**Dépend de :** SPEC-001, SPEC-002
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Éviter de ressaisir dix ingrédients chaque fois qu'on mange le même plat. Deux mécanismes complémentaires :

- **Recette** — un plat cuisiné à partir d'ingrédients, avec un nombre de portions. On enregistre « 1 portion de chili », pas les 8 ingrédients.
- **Repas enregistré** — un simple groupe d'aliments qu'on ajoute d'un coup (« mon petit-déj »), sans notion de portion ni de cuisson.

La distinction compte : une recette produit un nouvel « aliment » avec ses propres macros par portion ; un repas enregistré est un raccourci qui recrée simplement N entrées de journal.

## 2. Hors périmètre

- L'import de recettes depuis un site web → backlog
- Les instructions de préparation détaillées → un champ texte libre suffit en v1
- Les listes de courses → backlog

## 3. Parcours utilisateur

**Recette** : l'utilisateur crée « Chili con carne », ajoute ses ingrédients avec leurs quantités, indique « 6 portions ». L'app calcule les macros par portion. Ensuite, dans le journal, « Chili con carne — 1 portion » s'ajoute comme n'importe quel aliment.

**Repas enregistré** : après avoir saisi son petit-déjeuner, l'utilisateur tape « Enregistrer ce repas », le nomme. Les jours suivants, deux taps suffisent pour le rejouer.

## 4. Règles métier

### Recettes

> **RG-1** — Une recette contient 1 à 50 ingrédients. Chaque ingrédient référence un `food` avec une quantité en grammes résolus.

> **RG-2** — Les macros de la recette = somme des ingrédients. Les macros **par portion** = total / `servings`.

> **RG-3** — Une recette peut déclarer un **poids total après cuisson** (facultatif). S'il est renseigné, l'app calcule aussi les valeurs pour 100 g de produit fini, ce qui permet de peser sa part au lieu de compter en portions. C'est la seule façon correcte de gérer la perte d'eau à la cuisson.

> **RG-4** — Si un ingrédient a une macro manquante, la recette signale « valeurs incomplètes » et les totaux concernés sont marqués comme estimés. On ne remplace jamais une valeur manquante par 0 silencieusement.

> **RG-5** — Une recette peut contenir une autre recette comme ingrédient, sur **un seul niveau** d'imbrication. Les cycles sont détectés et refusés.

> **RG-6** — Modifier une recette ne modifie **jamais** les entrées de journal déjà créées à partir d'elle (figement, [ADR-0005](../adr/0005-snapshot-nutritionnel.md)).

> **RG-7** — Supprimer une recette est une suppression logique. Elle disparaît de la recherche mais l'historique reste lisible.

> **RG-8** — Une recette apparaît dans la recherche d'aliments, dans la section « Mes aliments », avec une icône distincte.

### Repas enregistrés

> **RG-9** — Un repas enregistré stocke une liste de références (`food` ou `recipe`) avec quantités, pas des copies de macros. Il est réévalué à chaque utilisation.

> **RG-10** — Ajouter un repas enregistré au journal crée **N entrées indépendantes**, une par élément. L'utilisateur peut ensuite en supprimer ou en modifier une sans toucher au modèle.

> **RG-11** — Un repas enregistré peut être créé depuis zéro, ou capturé depuis un créneau du journal déjà rempli.

> **RG-12** — Si un élément d'un repas enregistré référence un aliment supprimé, l'ajout se fait sans lui, avec un message indiquant ce qui a été ignoré.

## 5. Critères d'acceptation

```
CA-1  Création d'une recette
  Étant donné  500 g de bœuf haché (250 kcal/100 g) et 400 g de haricots (120 kcal/100 g)
  Quand        je crée une recette de 4 portions avec ces ingrédients
  Alors        le total affiché est 1730 kcal
  Et           une portion vaut 432,5 kcal

CA-2  Ajout d'une recette au journal
  Étant donné  la recette ci-dessus
  Quand        j'ajoute 2 portions au dîner
  Alors        une entrée « Chili con carne — 2 portions » de 865 kcal est créée

CA-3  Modification sans effet rétroactif
  Étant donné  une entrée de journal créée à partir d'une recette
  Quand        j'ajoute un ingrédient à la recette
  Alors        l'entrée existante conserve ses valeurs d'origine
  Et           les prochains ajouts utilisent les nouvelles valeurs

CA-4  Poids après cuisson
  Étant donné  une recette dont les ingrédients pèsent 900 g crus
  Et           un poids après cuisson déclaré de 750 g
  Quand        je consulte la recette
  Alors        l'app affiche aussi les valeurs pour 100 g de produit fini
  Et           je peux saisir « 180 g » au lieu de « 1 portion »

CA-5  Ingrédient incomplet
  Étant donné  une recette dont un ingrédient n'a pas de valeur de fibres
  Quand        je consulte ses totaux
  Alors        les calories et macros principales sont affichées normalement
  Et           les fibres sont marquées « incomplet »

CA-6  Imbrication cyclique
  Étant donné  la recette A qui contient la recette B
  Quand        je tente d'ajouter A comme ingrédient de B
  Alors        l'opération est refusée avec un message explicite

CA-7  Repas enregistré
  Étant donné  un petit-déjeuner de 3 aliments dans le journal
  Quand        je choisis « Enregistrer ce repas » et le nomme « Petit-déj classique »
  Alors        il apparaît dans la liste des repas enregistrés
  Et           l'ajouter à un autre jour crée 3 entrées distinctes et modifiables

CA-8  Repas avec un aliment supprimé
  Étant donné  un repas enregistré dont un aliment a été supprimé
  Quand        je l'ajoute au journal
  Alors        les autres éléments sont ajoutés
  Et           un message indique « 1 élément ignoré (aliment supprimé) »
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Recette à 0 portion | Refusé, minimum 1. |
| Recette sans ingrédient | Enregistrement possible en brouillon, mais non ajoutable au journal. |
| Poids après cuisson supérieur au poids cru | Autorisé (plat qui absorbe de l'eau : riz, pâtes) mais confirmation demandée au-delà de +50 %. |
| Nombre de portions décimal | Autorisé (1,5 portion). |
| 50 ingrédients | Limite dure, message explicite. |
| Recette dupliquée | Fonction « Dupliquer » explicite, pour créer une variante. |

## 7. Données

Tables : `recipes`, `recipe_items`, `saved_meals`, `saved_meal_items`.
Détails : [data-model.md](../architecture/data-model.md#recettes-et-repas).

## 8. Interface

Écran recette : en-tête (nom, portions, poids cuit), liste d'ingrédients avec macros par ligne, pied de page avec le récapitulatif par portion et pour 100 g.

Les repas enregistrés vivent dans un onglet de l'écran d'ajout d'aliment, à côté de « Fréquents ».

## 9. Performance et accessibilité

- Recalcul des totaux à chaque modification d'ingrédient : instantané, sans latence perceptible jusqu'à 50 ingrédients.
- Les macros par portion sont annoncées comme un tout au lecteur d'écran, pas colonne par colonne.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Gérer les facteurs de rendement à la cuisson par type d'aliment (le bœuf perd ~25 % à la poêle) ? *Proposition : non, le poids après cuisson (RG-3) couvre le besoin plus simplement.*
