# ADR-0003 — Open Food Facts + USDA + saisie manuelle

**Statut :** Accepté
**Date :** 2026-08-09

## Contexte

Le catalogue d'aliments est **la** raison pour laquelle MyFitnessPal domine son marché : des millions de produits et de codes-barres. C'est aussi la partie qu'un projet solo ne peut pas construire lui-même.

Contraintes :

- utilisateur francophone → il faut une bonne couverture des produits européens ;
- l'app doit rester utilisable hors ligne ;
- budget nul pour une base commerciale ;
- une donnée fausse est pire qu'une donnée absente : elle fausse silencieusement des mois de suivi.

## Options envisagées

### A. Open Food Facts uniquement

**Pour** — Gratuit, ouvert, ~3 millions de produits, excellente couverture française et européenne, codes-barres, API publique sans clé, communauté active.

**Contre** — Données contribuées par le public : champs manquants, unités incohérentes, valeurs franchement fausses. Faible sur les aliments **bruts** (« blanc de poulet cru », « riz basmati cuit ») qui constituent pourtant l'essentiel d'une alimentation de sportif. Licence ODbL avec obligations réelles.

### B. USDA FoodData Central uniquement

**Pour** — Données mesurées en laboratoire, très fiables, domaine public, aucune obligation de partage à l'identique. Excellent sur les aliments bruts.

**Contre** — Catalogue américain. Aucun code-barres exploitable pour les produits européens : le scan, fonctionnalité clé, serait mort-né. Nécessite une clé API.

### C. Base commerciale (Nutritionix, Edamam, FatSecret)

**Pour** — Données propres, normalisées, couverture large, support.

**Contre** — Payant, avec un coût qui croît avec l'usage. Dépendance à un fournisseur qui peut changer ses conditions ou fermer. Souvent interdit de mettre les données en cache durablement — ce qui **casse le hors-ligne**, c'est-à-dire notre principe fondateur. Rédhibitoire.

### D. Base construite à la main

**Contre** — Des mois de travail pour une couverture ridicule. Inenvisageable en solo.

## Décision

**Les trois sources, hiérarchisées et complémentaires :**

1. **Open Food Facts** — les produits emballés et le scan de code-barres. C'est le gros du volume et le cas d'usage quotidien.
2. **USDA FoodData Central** — les aliments bruts, là où OFF est faible et où USDA est excellent.
3. **Saisie manuelle** — le reste : plats de restaurant, recettes maison, compléments, tout ce que personne n'a référencé.

Priorité en cas de doublon : **perso > OFF > USDA**. L'utilisateur a toujours raison sur ses propres données.

Le point qui rend cette combinaison viable est le **type de contrat commun** : toutes les sources sont converties en `CanonicalFood` avant d'entrer dans l'app. La complexité de l'hétérogénéité est confinée dans deux fonctions pures et testables (`mapOffProduct`, `mapUsdaFood`), pas répandue dans le code.

Le second point clé est la **mise en cache définitive** : tout aliment utilisé une fois est copié en base locale et ne dépend plus jamais du réseau. Au bout de quelques semaines d'usage, l'utilisateur mange essentiellement dans son propre catalogue local.

## Conséquences

**Ce qu'on accepte :**
- **Deux intégrations à écrire et à maintenir** au lieu d'une. Coût réel, estimé à une semaine supplémentaire sur M2.
- **Des données sales à filtrer.** D'où les règles de rejet strictes (RG-11 et RG-12 de [SPEC-002](../specs/SPEC-002-catalogue-aliments.md)) : mieux vaut ne pas proposer un produit que d'en proposer un faux.
- **Les obligations ODbL** : attribution visible, et partage à l'identique de toute base dérivée distribuée (pack de démarrage). Détail dans [food-data-pipeline.md](../architecture/food-data-pipeline.md#licences-et-obligations-légales).
- **Une dépendance à des services gratuits** qui peuvent changer, ralentir ou limiter. Atténuation : dégradation silencieuse, le local reste toujours fonctionnel.
- **Une clé API USDA** à gérer au build.

**Ce que ça implique :**
- Les mappers sont la zone la plus testée du projet, avec des fixtures issues de vraies réponses d'API, cas tordus compris.
- Un écran « Sources et licences » est livré **en M2**, pas juste avant la publication.
- Le User-Agent envoyé à OFF est identifiant et honnête ; on ne se comporte pas en parasite envers un service bénévole.
- Un test de contrat manuel, lancé à la demande, détecte les changements d'API.

## Ce qui ferait revenir sur cette décision

- OFF fermant son API publique ou imposant des limites incompatibles avec un usage normal.
- Une base commerciale devenant gratuite **et** autorisant la mise en cache illimitée.
- Un taux de rejet qualité si élevé que la couverture réelle deviendrait inutilisable — à mesurer sur données réelles pendant M2.
