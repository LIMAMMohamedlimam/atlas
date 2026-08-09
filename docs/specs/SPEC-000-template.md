# SPEC-000 — Modèle de spécification

> Copier ce fichier pour toute nouvelle fonctionnalité. Numérotation continue, jamais réutilisée.

---

**Statut :** Brouillon | Validée | Implémentée | Obsolète
**Jalon :** M?
**Dépend de :** SPEC-XXX
**Dernière mise à jour :** AAAA-MM-JJ

## 1. Objectif

Deux ou trois phrases. Quel problème utilisateur cette fonctionnalité résout-elle ? Si on ne sait pas l'écrire simplement, la fonctionnalité n'est pas mûre.

## 2. Hors périmètre

Ce que cette spec ne couvre **pas**, pour éviter les dérives. Renvoyer vers d'autres specs ou vers le backlog.

## 3. Parcours utilisateur

Le chemin principal, écrit du point de vue de l'utilisateur, pas du code.

## 4. Règles métier

Numérotées `RG-1`, `RG-2`… pour pouvoir les citer dans le code, les tests et les revues.

> **RG-1** — Formulation testable, non ambiguë. Éviter « rapide », « pertinent », « approprié ».

## 5. Critères d'acceptation

Format Given/When/Then. Chaque critère devient au moins un test automatisé. C'est cette section que l'agent IA utilise comme contrat.

```
CA-1
  Étant donné  <l'état initial>
  Quand        <l'action>
  Alors        <le résultat observable>
```

## 6. Cas limites et erreurs

Le tableau qui évite 80 % des bugs. Une ligne par situation anormale.

| Situation | Comportement attendu |
|---|---|
| | |

## 7. Données

Tables et champs touchés. Renvoyer vers `docs/architecture/data-model.md`, ne pas dupliquer le schéma ici.

## 8. Interface

Description textuelle des écrans, des états (vide, chargement, erreur, plein) et des interactions. Un croquis ASCII vaut mieux qu'un paragraphe.

## 9. Performance et accessibilité

Budgets chiffrés (temps de réponse, nombre d'éléments) et exigences d'accessibilité (taille de cible tactile, contraste, lecteur d'écran).

## 10. Questions ouvertes

Liste datée. Une spec avec des questions ouvertes ne passe pas en statut « Validée ».
