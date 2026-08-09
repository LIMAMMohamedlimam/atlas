# Prompt — revue de code

La skill `/code-review` couvre le cas général. Ce document ajoute les points **spécifiques à ce projet** qu'une revue générique ne connaît pas.

## À vérifier en priorité, dans cet ordre

### 1. Les nombres (risque maximal)

- Une conversion d'unité écrite en ligne au lieu de passer par `src/lib/units/` ?
- Un arrondi appliqué **avant** une somme ? (dérive cumulée)
- Une division sans vérification du dénominateur ?
- Une valeur `null` traitée comme `0` par accident ? C'est différent : « inconnu » n'est pas « zéro ».
- Une comparaison d'égalité entre flottants ?
- Un nombre sans unité dans son nom (`weight` au lieu de `weightKg`) ?

### 2. Les dates

- Un jour de journal manipulé comme un timestamp ?
- Une date locale convertie en UTC quelque part ?
- Une durée calculée à partir de dates locales plutôt que d'horodatages ?
- Un `new Date()` en dehors de `src/lib/date/` ?

### 3. Les données de l'utilisateur

- Une suppression physique là où une suppression logique est attendue ?
- Un filtre `deleted_at IS NULL` oublié dans une requête ?
- Le snapshot des macros contourné, avec un calcul depuis la fiche courante ?
- Une écriture non transactionnelle qui pourrait laisser un état incohérent ?

### 4. Les frontières

- Une requête SQL hors de `src/data/` ?
- Un import de React dans `src/domain/` ?
- Un appel réseau hors de `src/data/remote/` ?
- De la logique métier dans un composant ?

### 5. La vie privée

- Un nouvel appel réseau ? Est-il documenté dans `security-privacy.md` ?
- Une donnée personnelle dans un `console.log` ?
- Une nouvelle permission ou dépendance accédant au réseau ou aux capteurs ?

### 6. Le hors-ligne

- Un écran qui casse sans réseau ?
- Un indicateur de chargement sur une opération purement locale ?
- Une erreur réseau qui bloque au lieu de dégrader ?

## Prompt à copier

```
Fais une revue du diff en cours pour le projet Atlas.

En plus des bugs de correction habituels, vérifie spécifiquement :

1. NOMBRES — conversions hors de src/lib/units/, arrondis avant somme,
   null traité comme 0, divisions non protégées, unités absentes des noms.
2. DATES — jours de journal (chaîne locale) confondus avec des horodatages UTC,
   new Date() hors de src/lib/date/.
3. DONNÉES — suppressions physiques, filtres deleted_at oubliés,
   contournement du snapshot nutritionnel (ADR-0005).
4. FRONTIÈRES — SQL hors de src/data/, React dans src/domain/,
   réseau hors de src/data/remote/, métier dans un composant.
5. VIE PRIVÉE — nouvel appel réseau non documenté, donnée personnelle journalisée.
6. HORS LIGNE — écran cassé en mode avion, chargement sur une opération locale.

Pour chaque point : le fichier, la ligne, et un scénario concret d'échec
(entrées précises → résultat faux). Pas de remarque de style.
Classe par gravité réelle. S'il n'y a rien, dis-le.
```

## Ce qu'une revue ne doit PAS signaler

Pour éviter le bruit qui fait ignorer les revues :

- des préférences de style couvertes par Prettier ;
- une dénormalisation délibérée et documentée (ADR-0005) ;
- l'absence de tests sur des composants d'affichage triviaux ;
- des optimisations non justifiées par une mesure ;
- l'absence de gestion d'un cas explicitement hors périmètre dans la spec.
