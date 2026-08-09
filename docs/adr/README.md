# Architecture Decision Records (ADR)

## À quoi ça sert

Un ADR répond à une question simple, posée six mois plus tard : **« pourquoi diable a-t-on fait ça ? »**

Sans ADR, chaque décision structurante est rediscutée à intervalle régulier, souvent par la même personne qui l'avait prise et qui a oublié ses raisons. Sur un projet solo assisté par IA, c'est encore plus vrai : un agent qui ne connaît pas le contexte proposera très logiquement de « simplifier » une décision dont il ignore la justification.

## Format

Un fichier par décision, numéroté, jamais renuméroté :

```
NNNN-titre-court.md
```

Structure :

```markdown
# ADR-NNNN — Titre

**Statut :** Proposé | Accepté | Remplacé par ADR-XXXX | Obsolète
**Date :** AAAA-MM-JJ

## Contexte
Quelle question se pose, et dans quel cadre. Les contraintes réelles.

## Options envisagées
Chacune avec ses avantages et ses inconvénients — honnêtement, pas en homme de paille.

## Décision
Ce qu'on fait, et surtout **pourquoi celle-là**.

## Conséquences
Ce que ça implique, y compris les inconvénients qu'on accepte.

## Ce qui ferait revenir sur cette décision
Les signaux concrets qui justifieraient d'en écrire un nouveau.
```

## Règles

1. **Un ADR accepté ne se modifie pas.** S'il devient faux, on en écrit un nouveau qui le remplace, et on met à jour le statut de l'ancien avec un lien.
2. **On écrit l'ADR au moment de décider**, pas après. Un ADR reconstitué de mémoire perd l'essentiel : les options écartées.
3. **Toutes les options sont présentées loyalement.** Un ADR qui caricature les alternatives ne sert à rien : la vraie valeur est de comprendre le compromis.
4. **On liste les inconvénients acceptés.** Une décision sans inconvénient est une décision mal analysée.

## Quand écrire un ADR

- Choix d'une technologie structurante (framework, base, bibliothèque difficile à remplacer).
- Choix de modélisation avec effets durables (dénormalisation, format d'identifiant).
- Décision qui contredit une pratique courante — c'est là que le « pourquoi » vaut le plus cher.
- Décision qu'on a hésité à prendre. Si le choix a demandé réflexion, il en demandera à nouveau.

**Pas besoin d'ADR** pour : le nom d'une variable, un choix d'implémentation local et réversible, une bibliothèque utilitaire remplaçable en une heure.

## Index

| N° | Décision | Statut |
|---|---|---|
| [0001](0001-react-native-expo.md) | React Native + Expo plutôt que du natif Kotlin | Accepté |
| [0002](0002-sqlite-drizzle-local-first.md) | SQLite + Drizzle, 100 % local | Accepté |
| [0003](0003-sources-donnees-alimentaires.md) | Open Food Facts + USDA + saisie manuelle | Accepté |
| [0004](0004-gestion-etat.md) | Drizzle live queries + Zustand, pas de Redux | Accepté |
| [0005](0005-snapshot-nutritionnel.md) | Figer les macros dans les entrées de journal | Accepté |

À écrire quand la question se posera : bibliothèque de graphiques (M5), format et chiffrement de l'export (M6), stratégie de tests E2E (M4).
