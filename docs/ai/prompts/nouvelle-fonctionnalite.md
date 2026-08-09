# Prompt — implémenter une unité de fonctionnalité

À copier, compléter entre crochets, et donner à l'agent. Il suppose que `CLAUDE.md` est déjà chargé.

---

```
Contexte : projet Atlas (app nutrition + musculation, React Native/Expo, SQLite local).

Tâche : [décrire l'unité en une phrase]

Spec : docs/specs/SPEC-[XXX].md, critères CA-[x] et CA-[y], règles RG-[a] et RG-[b].

Avant de coder :
1. Lis la spec en entier, pas seulement les critères cités.
2. Lis les ADR concernés s'il y en a.
3. Regarde comment [module similaire existant] est écrit, et suis le même style.
4. Propose-moi un plan : fichiers touchés, décisions techniques, tests prévus,
   cas limites, ce que tu laisses hors périmètre. Ne code rien avant validation.

Contraintes :
- Périmètre strictement limité à la spec. Toute idée en plus → propose-la pour le backlog.
- Ordre d'implémentation : schéma/migration → domaine → repository → hook → UI.
- Un test par critère d'acceptation, nommé avec sa référence CA-x.
- Les cas limites du tableau §6 de la spec sont traités.
- Aucune valeur nutritionnelle inventée : null si la donnée manque.
- Aucune chaîne de texte en dur dans l'UI.

Terminé signifie : typecheck + lint + tests verts, ET la checklist de
docs/engineering/definition-of-done.md parcourue. Dis-moi explicitement ce que
tu n'as pas pu vérifier (par exemple un essai sur appareil réel).
```

---

## Variante — correction de bug

```
Bug : [symptôme observé, pas la cause supposée]
Reproduction : [étapes exactes]
Attendu : [comportement, avec la référence de spec si elle existe]

Procédure imposée :
1. Écris d'abord un test qui reproduit le bug.
2. Montre-moi qu'il ÉCHOUE avant toute correction.
3. Corrige.
4. Montre-moi qu'il passe, et que le reste de la suite est toujours vert.

Explique la cause racine, pas seulement le correctif. Si la cause révèle un
problème plus large, dis-le sans le corriger dans la même PR.
```

---

## Variante — mapper de source alimentaire

```
Tâche : écrire le mapper [Open Food Facts | USDA] vers CanonicalFood.

Références :
- docs/architecture/food-data-pipeline.md (extraction, pièges, filtres qualité)
- docs/specs/SPEC-002, règles RG-10 à RG-13

Contrat : fonction pure, entrée = JSON brut, sortie = CanonicalFood | null.
Aucun effet de bord, aucun accès réseau, aucun accès base.

Fixtures à couvrir obligatoirement :
- produit complet
- énergie en kJ uniquement
- énergie absente mais macros présentes → estimation, energyIsEstimated = true
- énergie et macros absentes → null
- valeurs aberrantes (>900 kcal/100 g, macros >105 g) → null
- serving_size en texte illisible → aucune portion, pas d'erreur
- nom vide → null
- sel absent, sodium présent → conversion ×2,5

Utilise des réponses d'API réelles comme fixtures, pas des objets inventés.
```

---

## Variante — migration de base

```
Tâche : [changement de schéma souhaité]

C'est l'opération la plus risquée du projet : sans serveur, une migration ratée
détruit les données de l'utilisateur sans recours.

Procédure :
1. Mets à jour src/data/db/schema.ts
2. Génère la migration avec drizzle-kit
3. LIS la migration générée et explique-moi ce qu'elle fait, ligne par ligne
4. Écris un test qui part d'une base de la version PRÉCÉDENTE remplie de données
   réalistes, applique la migration, et vérifie qu'aucune donnée n'est perdue
5. Mets à jour docs/architecture/data-model.md dans le même changement

Interdits : modifier une migration déjà livrée, supprimer une colonne sans
plan de reprise des données.
```
