# ADR-0005 — Figer les valeurs nutritionnelles dans les entrées de journal

**Statut :** Accepté
**Date :** 2026-08-09

## Contexte

Quand l'utilisateur enregistre « 150 g de riz basmati » le 9 août, l'app calcule 195 kcal à partir de la fiche de l'aliment.

Que se passe-t-il si, le 15 septembre, cette fiche change ? Les cas sont fréquents et légitimes :

- un contributeur corrige une erreur sur Open Food Facts ;
- l'utilisateur corrige lui-même un de ses aliments personnels ;
- une recette est modifiée (un ingrédient ajouté) ;
- le fabricant reformule son produit.

**Faut-il que le journal du 9 août change rétroactivement ?**

C'est une question de modélisation, apparemment mineure, dont les conséquences sont profondes et pénibles à corriger après coup.

## Options envisagées

### A. Référence vivante — l'entrée pointe vers l'aliment, tout est calculé à l'affichage

**Pour** — Schéma normalisé, propre, sans duplication. Une correction de donnée améliore automatiquement tout l'historique. C'est le réflexe de tout développeur formé à la normalisation.

**Contre** — **Un historique qui se réécrit tout seul.** L'utilisateur voit une moyenne calorique de juillet qui change sans qu'il ait rien fait. Il ne peut plus faire confiance à ses propres données. Pire : si une correction OFF est mauvaise, elle contamine rétroactivement des mois de suivi. Et si l'aliment est supprimé, l'entrée devient illisible ou disparaît.

### B. Copie figée — l'entrée stocke sa propre copie des valeurs

**Pour** — L'historique est **immuable**, ce qui est le comportement attendu d'un journal. Les données passées restent lisibles même si l'aliment est supprimé. Les lectures sont plus rapides : les totaux du jour se calculent sans aucune jointure. Une future synchronisation est plus simple : une entrée est autonome.

**Contre** — Duplication de données. Une correction n'améliore pas l'historique. Environ 80 octets supplémentaires par entrée — soit à peine 1,6 Mo pour 20 000 entrées, donc négligeable.

### C. Hybride — figer, mais proposer un recalcul manuel

**Pour** — Le meilleur des deux mondes en théorie.

**Contre** — Une fonctionnalité de plus, une interface de plus, un mode de plus à tester, pour un besoin qui ne s'est jamais manifesté. Complexité non justifiée.

## Décision

**Option B : les entrées de journal figent leurs valeurs nutritionnelles à la saisie.**

L'entrée conserve la référence `food_id` (utile pour « ajouter à nouveau », les statistiques par aliment, la reprise de portion), mais **tous les calculs partent des colonnes figées**, jamais de la fiche de l'aliment.

Sont figés : le nom, la marque, et les valeurs nutritionnelles **pour cette entrée** (déjà multipliées par la quantité).

La même règle s'applique :
- aux entrées créées à partir d'une **recette** (RG-6 de [SPEC-004](../specs/SPEC-004-recettes-et-repas.md)) ;
- au **nom de l'exercice** dans `workout_sets` (RG-11 de [SPEC-006](../specs/SPEC-006-programmes-et-exercices.md)) ;
- au **nom de la séance** dans `workout_sessions`.

Le principe est général : **un enregistrement historique est un fait daté, pas une vue sur l'état actuel.** C'est exactement le raisonnement d'une facture, qui recopie le prix du produit au lieu de le référencer.

## Conséquences

**Ce qu'on accepte :**
- Dénormalisation assumée. Elle doit être **expliquée dans le schéma** pour qu'un relecteur — humain ou agent IA — ne la « corrige » pas par réflexe. C'est fait dans [data-model.md](../architecture/data-model.md#journal).
- Une correction de donnée ne bénéficie qu'aux **futures** saisies. Acceptable, et même souhaitable.
- ~80 octets par entrée. Non significatif.

**Ce que ça implique :**
- La fonction `snapshotFrom(food, grams)` vit dans `src/domain/nutrition/macros.ts` et est **le seul** endroit qui construit ces valeurs. Elle est testée avec soin.
- Les totaux du jour ne font **aucune jointure** avec `foods` : une seule table à lire, plus rapide et plus robuste.
- Les statistiques par aliment passent par `food_id` (la référence), et non par le nom figé.
- Modifier la quantité d'une entrée **recalcule** le snapshot à partir de l'aliment courant. C'est un cas limite à documenter dans l'interface : « recalculé avec les valeurs actuelles ».

**Bénéfice inattendu :** cette décision rend la suppression logique d'un aliment totalement inoffensive. Aucune cascade, aucune entrée orpheline, aucun affichage cassé.

## Ce qui ferait revenir sur cette décision

Rien de prévisible. Si un besoin de recalcul rétroactif apparaissait (par exemple une correction massive de données), il serait traité par une **opération de maintenance explicite et réversible**, pas en changeant le modèle.
