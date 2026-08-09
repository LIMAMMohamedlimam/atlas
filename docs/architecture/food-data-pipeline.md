# Pipeline des données alimentaires

Comment on obtient, normalise, filtre et met en cache les données nutritionnelles venant de trois sources hétérogènes.

C'est le sous-système le plus risqué du projet : les données externes sont sales, les licences ont des obligations réelles, et une erreur de normalisation contamine durablement la base de l'utilisateur.

## Les trois sources

| Source | Ce qu'elle apporte | Ses limites |
|---|---|---|
| **Open Food Facts** (OFF) | ~3 M de produits emballés avec codes-barres, excellente couverture européenne et française | Données contribuées par le public : champs manquants, unités incohérentes, valeurs aberrantes |
| **USDA FoodData Central** | Aliments bruts (viandes, légumes, céréales) mesurés en laboratoire, très fiables | Catalogue américain, pas de codes-barres exploitables, peu de produits européens |
| **Saisie manuelle** | Ce que les deux autres n'ont pas : le plat du restaurant du coin, la recette de famille | Fiabilité = celle de l'utilisateur |

Ordre de priorité en cas de doublon : **perso > OFF > USDA**. L'utilisateur a toujours le dernier mot sur ses propres données.

## Le contrat commun : `CanonicalFood`

Tout ce qui entre dans l'app passe par cette forme unique. Aucune donnée brute d'une source n'atteint la couche métier.

```ts
// src/data/remote/types.ts
export type CanonicalFood = {
  source: 'off' | 'usda' | 'custom';
  sourceId: string | null;
  barcode: string | null;
  name: string;
  brand: string | null;
  baseUnit: 'g' | 'ml';
  /** Toutes les valeurs pour 100 baseUnit. null = inconnu, jamais 0. */
  nutrients: {
    energyKcal: number;        // seul champ obligatoire
    proteinG: number | null;
    carbsG: number | null;
    sugarsG: number | null;
    fatG: number | null;
    saturatedFatG: number | null;
    fiberG: number | null;
    saltG: number | null;
  };
  energyIsEstimated: boolean;  // kcal recalculées depuis les macros
  portions: Array<{ label: string; grams: number }>;
  dataQuality: number;         // 0-100
};
```

Chaque source a son mapper — `mapOffProduct()`, `mapUsdaFood()` — et **c'est là que sont concentrés les tests**. Un mapper est une fonction pure : entrée JSON brut, sortie `CanonicalFood | null`. Facile à tester avec des exemples réels enregistrés en fixtures.

## Open Food Facts

### Points d'entrée

- **Par code-barres** : `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Recherche textuelle** : API de recherche v2 / Search-a-licious `[À VÉRIFIER : comparer les deux endpoints au moment de l'implémentation, la plateforme a évolué]`

Toujours restreindre les champs demandés (`?fields=code,product_name,brands,nutriments,serving_size,...`) : sans cela, une fiche produit fait plusieurs centaines de kilo-octets, dont on n'utilise que 2 %.

### Bonnes pratiques d'appelant

- **User-Agent identifiant obligatoire** : `Atlas/1.0 (contact@exemple.fr)`. OFF est un service bénévole ; un client anonyme et bavard se fait bloquer, et c'est légitime.
- **Limites de débit** : plus strictes sur la recherche que sur la lecture par code-barres. `[À VÉRIFIER : valeurs courantes dans la doc OFF au moment de l'implémentation]`. Concrètement : anti-rebond de 400 ms, une requête en vol à la fois (annulation de la précédente), cache local systématique, jamais de réessai en boucle.
- **Délai maximal de 5 s**, puis abandon silencieux avec repli sur les résultats locaux.

### Extraction des nutriments

Les valeurs utiles sont dans `product.nutriments`, suffixées `_100g` :

```
energy-kcal_100g, proteins_100g, carbohydrates_100g, sugars_100g,
fat_100g, saturated-fat_100g, fiber_100g, salt_100g, sodium_100g
```

Pièges concrets rencontrés avec OFF :

1. **Énergie en kJ uniquement.** Si `energy-kcal_100g` est absent mais `energy-kj_100g` présent : `kcal = kJ / 4,184`.
2. **Aucune énergie.** Si les macros existent : `kcal = 4×P + 4×G + 9×L`, et `energyIsEstimated = true`. Sinon → **rejet** (RG-11 de SPEC-002).
3. **Sel vs sodium.** Les deux existent parfois avec des valeurs contradictoires. On retient le sel ; s'il manque, `sel = sodium(g) × 2,5`.
4. **Liquides.** Si `product.quantity` contient « ml » / « l », ou si la catégorie est une boisson, `baseUnit = 'ml'`. Sinon `'g'`. Heuristique imparfaite, à corriger par l'utilisateur.
5. **`serving_size` en texte libre.** « 30 g », « 1 portion (30g) », « 2 biscuits = 25 g »… On extrait le premier nombre suivi de `g`/`ml`. En cas d'échec, pas de portion — surtout pas de valeur inventée.
6. **Nom vide ou marque dans le nom.** Un produit sans `product_name` exploitable est rejeté.

### Filtres de qualité (RG-12 de SPEC-002)

Un produit est **rejeté** si :

- `energyKcal` est absent ou non calculable ;
- `energyKcal > 900` pour 100 g (l'huile pure plafonne à ~900) ;
- `protein + carbs + fat > 105 g` pour 100 g (physiquement impossible) ;
- une valeur négative apparaît ;
- le nom est vide ou fait moins de 2 caractères.

Le score `dataQuality` (0-100) combine complétude des macros, présence d'une portion, présence de la marque. Il sert à **trier** les résultats, jamais à en cacher.

## USDA FoodData Central

- API : `https://api.nal.usda.gov/fdc/v1/`, clé requise (gratuite).
- Endpoints : `/foods/search` et `/food/{fdcId}`.
- **La clé ne doit pas être en clair dans le dépôt** : elle passe par `app.config.ts` et une variable d'environnement au build. Ce n'est pas un secret fort (une app mobile ne peut pas garder de secret), mais on ne la publie pas non plus.

Particularité du format : les nutriments sont une liste indexée par identifiant numérique, pas des champs nommés.

| ID | Nutriment | Unité |
|---|---|---|
| 1008 | Énergie | kcal |
| 1003 | Protéines | g |
| 1005 | Glucides | g |
| 1004 | Lipides | g |
| 1063 / 2000 | Sucres | g |
| 1258 | Acides gras saturés | g |
| 1079 | Fibres | g |
| 1093 | Sodium | mg |

`[À VÉRIFIER : confirmer les identifiants dans la documentation FDC avant implémentation — ils sont stables mais méritent une vérification]`

Les valeurs sont déjà pour 100 g dans les types `Foundation` et `SR Legacy` — à confirmer par type de données, car `Branded` fonctionne différemment.

Priorité de recherche : `Foundation` > `SR Legacy` > `Survey` > `Branded` (les produits de marque américains n'intéressent pas la cible française).

## Stratégie de cache

**Principe : tout aliment vu une fois est gardé pour toujours.**

```
Scan / sélection d'un résultat en ligne
        ↓
mapper → CanonicalFood → filtres qualité
        ↓
INSERT dans foods (source, source_id) — ON CONFLICT : mise à jour si plus complet
        ↓
disponible hors ligne définitivement, indexé dans foods_fts
```

Conséquence recherchée : au bout de quelques semaines, l'utilisateur ne dépend plus du réseau, parce que 90 % de ce qu'on mange revient chaque semaine.

**Pas de rafraîchissement automatique** des fiches en cache : les entrées de journal figent déjà leurs valeurs ([ADR-0005](../adr/0005-snapshot-nutritionnel.md)), donc actualiser n'apporterait rien et consommerait du réseau. Un bouton « Actualiser depuis la source » est proposé sur la fiche produit.

## Pack de démarrage (fin de M2)

Problème : à la première ouverture, hors ligne, la base est vide et l'app paraît inutile.

Solution envisagée : embarquer un fichier SQLite pré-rempli d'environ **2 000 aliments courants** (aliments bruts USDA + produits français très répandus), construit par un script hors ligne à partir des dumps.

- Coût estimé : 5 à 10 Mo dans l'APK.
- Ce script vit dans `tools/build-seed-db/`, s'exécute manuellement, et son résultat est versionné comme un asset — **pas les dumps sources**, qui pèsent plusieurs gigaoctets et n'ont rien à faire dans Git.
- Impose de respecter l'ODbL (section suivante).

## Licences et obligations légales

**À lire avant d'écrire une ligne de code d'import. Ce ne sont pas des recommandations.**

### Open Food Facts — ODbL 1.0

La base OFF est sous **Open Database License**. Les obligations concrètes :

1. **Attribution** — mentionner Open Food Facts de façon visible : écran « À propos », fiche produit issue d'OFF, et description sur le Play Store.
2. **Partage à l'identique (share-alike)** — si on distribue une **base dérivée** (le pack de démarrage en est une), elle doit être distribuée sous ODbL, avec un moyen de l'obtenir.
3. **Pas de verrouillage technique** — on ne peut pas empêcher l'accès à la base dérivée par des mesures techniques.

Ce que cela **n'impose pas** : l'application elle-même (le code) n'a pas à être open source. L'ODbL porte sur la base de données, pas sur l'œuvre produite à partir d'elle.

Ce que cela impose en pratique pour nous :
- une page « Sources et licences » dans l'app ;
- si le pack de démarrage est distribué dans l'APK, publier ce pack sous ODbL avec un lien de téléchargement ;
- les images produit OFF ont leurs propres licences (souvent CC-BY-SA) — **on ne les embarque pas en v1**, ce qui évite le sujet.

`[À VÉRIFIER : faire relire cette analyse avant publication sur le Play Store. Ce document n'est pas un avis juridique.]`

### USDA FoodData Central

Données produites par le gouvernement américain, **domaine public**. Pas d'obligation de partage à l'identique. L'USDA demande de ne pas laisser entendre qu'il approuve le produit. Attribution mentionnée par courtoisie et clarté.

### Données saisies par l'utilisateur

Elles lui appartiennent. Elles ne sont **jamais** renvoyées vers OFF ou USDA, même « pour contribuer », sans une action explicite et informée de sa part. Ce n'est pas prévu en v1.

## Tests

| Quoi | Comment |
|---|---|
| Mappers | Fixtures JSON de produits réels (dont des cas tordus : kJ seul, sel absent, portion illisible). Fonctions pures, tests instantanés. |
| Filtres qualité | Tests aux bornes : 899/900/901 kcal, somme de macros à 104/105/106 g. |
| Clients réseau | Requêtes simulées (MSW ou équivalent). Aucun test unitaire ne doit toucher le vrai réseau. |
| Contrat réel | Un test d'intégration **manuel**, lancé à la demande, qui interroge vraiment les API avec une poignée de codes-barres connus. Il détecte les changements d'API. Jamais en CI. |

## Risques identifiés

| Risque | Impact | Parade |
|---|---|---|
| L'API OFF change de format | Recherche cassée | Mappers isolés + test de contrat manuel + repli local toujours fonctionnel |
| Blocage pour usage excessif | Recherche indisponible | User-Agent propre, anti-rebond, cache agressif, dégradation silencieuse |
| Données sales importées | Base utilisateur polluée durablement | Filtres stricts à l'entrée, correction possible par duplication |
| Non-conformité ODbL | Risque juridique et retrait du Play Store | Écran de licences dès M2, pas seulement avant la publication |
| USDA impose une clé par utilisateur | Fonction indisponible | Le catalogue reste utilisable via OFF et la saisie manuelle |
