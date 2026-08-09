# Conventions de code

Ces règles existent pour une raison précise : sur un projet solo assisté par IA, la cohérence n'est plus une question de goût. Un code régulier est un code qu'un agent lit, comprend et modifie correctement. Un code irrégulier produit des contributions irrégulières.

## TypeScript

**Mode strict, sans exception.**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[0] est T | undefined — indispensable ici
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- **`any` est interdit.** Si un type est inconnu, c'est `unknown`, et on le réduit explicitement. Une seule exception tolérée : les réponses brutes d'API externes, immédiatement validées par un schéma Zod dans le mapper.
- **Pas de `as`** sauf pour réduire un `unknown` après validation. Une assertion de type est une promesse non tenue au compilateur.
- **Types nommés pour les unités.** Un `number` ne dit pas s'il s'agit de grammes, de kilos ou de calories. C'est la source d'erreur numéro un d'une app comme celle-ci :

```ts
type Grams = number & { readonly __brand: 'Grams' };
type Kilocalories = number & { readonly __brand: 'Kilocalories' };
type Kilograms = number & { readonly __brand: 'Kilograms' };
```

Ce coût minime empêche définitivement de passer des kilos là où on attend des grammes.

## Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers de composants | PascalCase | `DiaryDayScreen.tsx` |
| Autres fichiers | kebab-case | `one-rep-max.ts` |
| Composants React | PascalCase | `MacroRing` |
| Hooks | `use` + camelCase | `useDiaryDay` |
| Fonctions et variables | camelCase | `resolveGrams` |
| Constantes globales | SCREAMING_SNAKE | `SAFETY_FLOOR_KCAL` |
| Types et interfaces | PascalCase, sans préfixe `I` | `CanonicalFood` |
| Tables et colonnes SQL | snake_case | `diary_entries`, `energy_kcal` |
| Booléens | préfixe `is` / `has` / `should` | `isCompleted`, `hasMissingMacros` |

**Les unités font partie du nom** : `weightKg`, `energyKcal`, `restSeconds`, `heightCm`. Jamais `weight`, `energy`, `rest` seuls.

## Organisation des fichiers

Ordre imposé à l'intérieur d'un fichier :

1. imports (externes, puis internes, puis relatifs)
2. types et interfaces
3. constantes
4. le composant ou la fonction principale
5. les fonctions auxiliaires

Règles de taille :
- **Un fichier > 400 lignes** doit être découpé.
- **Une fonction > 50 lignes** doit être découpée.
- **Un composant avec plus de 5 props** est probablement mal découpé.

Ces seuils sont indicatifs pour un humain, et opérationnels pour un agent IA : ils gardent les fichiers dans une taille où le contexte reste maîtrisable.

## Frontières entre couches

Vérifiées automatiquement, pas seulement par discipline :

```jsonc
// .eslintrc — import/no-restricted-paths
{
  "zones": [
    { "target": "./src/domain", "from": "./src/data",     "message": "Le domaine ne connaît pas la couche données" },
    { "target": "./src/domain", "from": "./src/app",      "message": "Le domaine ne connaît pas l'UI" },
    { "target": "./src/domain", "from": "react",          "message": "Le domaine est du TypeScript pur" },
    { "target": "./src/app",    "from": "./src/data/db",  "message": "Passe par un repository" },
    { "target": "./src/ui",     "from": "./src/domain",   "message": "Les composants génériques n'ont pas de métier" }
  ]
}
```

Une règle non outillée n'est pas une règle, c'est un vœu.

## React et React Native

- **Composants fonctionnels uniquement.**
- **Pas de logique métier dans un composant.** Un composant appelle un hook, affiche le résultat, remonte les événements. S'il calcule des macros, c'est un bug de conception.
- **Un hook par cas d'usage** : `useDiaryDay(date)`, `useActiveSession()`, `useFoodSearch(query)`. Le composant ne sait pas d'où viennent les données.
- **`React.memo` sur les lignes de liste** (entrées de journal, séries) — ce sont les seuls endroits où ça compte réellement.
- **FlashList** dès qu'une liste peut dépasser 50 éléments.
- **Aucun texte en dur dans l'interface.** Tout passe par `t('diary.emptyState')`, y compris pendant le développement — remettre les traductions après coup ne se fait jamais.

## Gestion des erreurs

- **Pas de `catch` silencieux.** Soit on traite, soit on remonte.
- **Erreurs typées pour les cas métier** :

```ts
class FoodValidationError extends Error {
  constructor(readonly reason: 'missing_energy' | 'implausible_values' | 'empty_name') {
    super(`Food rejected: ${reason}`);
  }
}
```

- **Les erreurs réseau ne bloquent jamais.** Le repli local est toujours disponible ([SPEC-002](../specs/SPEC-002-catalogue-aliments.md) CA-4).
- **Les erreurs de base de données sont graves** : on les affiche, avec une proposition d'export brut. Jamais de dégradation silencieuse sur les données de l'utilisateur.
- **Un `ErrorBoundary` par onglet**, pour qu'un plantage sur l'écran Progression n'empêche pas de terminer sa séance.

## Nombres — le sujet sensible de cette app

- **Toujours arrondir à l'affichage, jamais au stockage.** Les arrondis successifs dérivent : 3 × 33,33 g arrondi à chaque étape ne donne pas 100 g.
- **Affichage** : calories à l'entier, macros à 0,1 g, poids à 0,1 kg.
- **Pas de virgule flottante pour les comparaisons d'égalité.** `Math.abs(a - b) < 0.01`.
- **Toute division vérifie son dénominateur.** `servings` peut valoir 0 dans une base importée corrompue.

## Commentaires

Un commentaire explique **pourquoi**, jamais **quoi** :

```ts
// ✗ inutile
// incrémente le compteur d'utilisation
food.useCount += 1;

// ✓ utile
// Dénormalisé volontairement : recalculer depuis diary_entries imposerait
// un balayage complet à chaque ouverture de l'écran de recherche.
food.useCount += 1;
```

Toute formule métier cite sa source :

```ts
/** Mifflin-St Jeor. Voir SPEC-003 RG-1. */
```

## Imports

Ordre : bibliothèques externes → alias internes (`@/…`) → relatifs. Alias `@/` configuré vers `src/`. Pas de `../../..` au-delà de deux niveaux : au-delà, c'est que le fichier est mal placé.

## Ce qui bloque une PR

- `tsc --noEmit` en erreur
- ESLint en erreur (les avertissements passent, les erreurs non)
- Un test en échec
- Un `any` non justifié par un commentaire
- Une requête SQL hors de `src/data/`
- Une chaîne de texte en dur dans l'interface
- Une migration modifiée après livraison
