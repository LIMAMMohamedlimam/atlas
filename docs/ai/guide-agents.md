# Travailler avec des agents IA sur ce projet

Ce document explique **comment le dépôt est structuré pour qu'un agent IA soit efficace**, et où sont ses limites. Il s'adresse autant à toi qu'à l'agent.

## Le constat de départ

Un agent IA est excellent pour : écrire du code répétitif, produire des tests exhaustifs, appliquer une convention, normaliser des données, refactoriser mécaniquement.

Il est mauvais pour : deviner une intention non écrite, arbitrer un compromis produit, savoir ce qui a déjà été essayé et écarté.

**Conclusion pratique : tout ce qui n'est pas écrit sera réinventé, souvent différemment à chaque fois.** D'où cette documentation, qui n'est pas de la bureaucratie mais l'entrée de contexte de l'agent.

## Les cinq piliers

### 1. La spec est le contrat

Un agent n'implémente jamais depuis une phrase de conversation. Il implémente depuis un fichier `docs/specs/SPEC-XXX` contenant des critères d'acceptation `CA-1`, `CA-2`… en Given/When/Then.

Bénéfices concrets :
- l'agent sait quand il a fini (les critères passent) ;
- chaque critère devient un test nommé, donc traçable ;
- la revue consiste à vérifier des critères, pas à relire ligne par ligne ;
- deux agents lancés sur la même spec produisent des résultats comparables.

**Si la spec n'existe pas, on l'écrit d'abord.** C'est plus rapide que de corriger trois implémentations qui partaient d'hypothèses différentes.

### 2. Les ADR empêchent de rediscuter

Sans ADR, un agent proposera très raisonnablement de « normaliser » les macros figées dans `diary_entries` — c'est ce que dit tout manuel de conception. Avec [ADR-0005](../adr/0005-snapshot-nutritionnel.md), il comprend pourquoi cette dénormalisation est délibérée.

**Règle : toute décision contre-intuitive doit être documentée à l'endroit où on la rencontre**, pas seulement dans un ADR lointain. D'où les commentaires « pourquoi » dans le schéma de base.

### 3. Des frontières nettes et outillées

L'architecture en couches n'est pas une préférence esthétique : c'est ce qui permet à un agent de modifier `src/domain/nutrition/macros.ts` en sachant qu'il ne peut rien casser dans l'interface.

Et surtout : les frontières sont **vérifiées par ESLint**. Un agent qui se trompe reçoit une erreur immédiate, plutôt que de produire du code plausible mais interdit.

### 4. Des fichiers petits, une organisation prévisible

Un agent lit un contexte limité. Un fichier de 1 200 lignes le force à travailler sur des extraits, et il perd la cohérence d'ensemble.

- Fichiers < 400 lignes.
- Un fichier = une responsabilité.
- Nommage prévisible : `useDiaryDay` est dans `src/features/diary/hooks/use-diary-day.ts`, sans surprise possible.
- Les tests sont à côté du code testé (`macros.test.ts` près de `macros.ts`).

### 5. Une boucle de vérification rapide

Un agent progresse en essayant, en observant le résultat, en corrigeant. Sans retour rapide, il devine — et un agent qui devine produit du code qui a l'air juste.

- Tests unitaires du domaine : < 5 s.
- `typecheck` : < 15 s.
- **Un agent doit toujours pouvoir vérifier son travail lui-même.**

C'est aussi pour ça que la logique métier est en TypeScript pur : elle est vérifiable sans émulateur, donc l'agent peut boucler seul.

## Ce qu'un agent peut faire seul

- Implémenter une fonction du domaine à partir d'une règle métier (`RG-x`).
- Écrire les tests unitaires d'un critère d'acceptation.
- Écrire un mapper OFF/USDA à partir de fixtures.
- Générer les repositories et leurs tests d'intégration.
- Appliquer une convention sur tout le dépôt.
- Refactoriser mécaniquement (extraire, renommer, découper).
- Écrire une migration Drizzle à partir d'un changement de schéma.
- Compléter la traduction de chaînes.

## Ce qui demande une validation humaine

- Trancher un compromis produit (fonctionnalité dedans ou dehors).
- Choisir une nouvelle dépendance.
- Décider d'un changement de schéma non trivial.
- Modifier une règle de sécurité utilisateur (plancher calorique, âge minimum).
- Tout ce qui touche aux permissions, au réseau ou à l'export.
- Publier quoi que ce soit.

## Les pièges observés, et comment les éviter

| Piège | Ce qui se passe | Parade |
|---|---|---|
| **Élargissement silencieux** | On demande un écran, l'agent ajoute trois fonctionnalités « pendant qu'on y est » | Le périmètre est celui de la spec. Hors périmètre → backlog. Écrit dans `CLAUDE.md`. |
| **Valeurs inventées** | Une donnée nutritionnelle manque, l'agent met une valeur plausible | Règle absolue : `null`, jamais une invention. Répétée dans `CLAUDE.md` et dans les specs. |
| **Renormalisation** | L'agent « corrige » les macros figées | ADR-0005 + commentaire dans le schéma. |
| **Tests écrits après coup qui passent toujours** | Le test valide le code plutôt que la spec | Écrire le test à partir du `CA-x`, vérifier qu'il échoue d'abord. |
| **Dérive de conventions** | Chaque session invente son style | `CLAUDE.md` + ESLint + Prettier. Ce qui est outillé ne dérive pas. |
| **Fausse complétude** | « C'est terminé » alors que les cas limites ne sont pas traités | [definition-of-done.md](../engineering/definition-of-done.md), à parcourir explicitement. |
| **Contexte perdu entre sessions** | Une décision prise hier est reprise à zéro aujourd'hui | Décision structurante → ADR. Décision mineure → commentaire dans le code. |

## Découpage des tâches

**Une tâche pour un agent = une unité vérifiable en moins de 400 lignes de diff.**

Mauvais découpage : « implémente le journal nutritionnel » (SPEC-001 entière).

Bon découpage :
1. Schéma `diary_entries` + migration + tests.
2. `DiaryRepository` : CRUD + filtre `deleted_at` + tests d'intégration.
3. `snapshotFrom()` dans le domaine + tests unitaires (CA-2, CA-3).
4. Hook `useDiaryDay(date)` + tests.
5. Écran de journal, affichage seul.
6. Navigation entre jours (CA-7).
7. Suppression avec annulation (CA-5).

Chaque étape est testable, relisable, et réversible indépendamment.

## Le rôle de `CLAUDE.md`

C'est le fichier lu automatiquement à chaque session. Il doit contenir **ce qui s'applique tout le temps** :

- la langue de travail ;
- les règles non négociables ;
- les commandes ;
- ce qu'il ne faut jamais faire.

Il ne doit **pas** contenir : la spec détaillée d'une fonctionnalité, l'historique du projet, des explications longues. Ces éléments vivent dans `docs/` et sont lus à la demande.

**Un `CLAUDE.md` trop long est ignoré ; trop court, il est inutile.** Une page, dense, mise à jour dès qu'une convention change.

## Utiliser plusieurs agents

Utile quand les tâches sont **réellement indépendantes** :

- un agent sur le mapper OFF, un autre sur le mapper USDA ;
- un agent qui écrit les tests d'un module pendant qu'on travaille sur un autre.

Inutile, voire nuisible, quand les tâches touchent aux mêmes fichiers : les conflits coûtent plus cher que le parallélisme ne rapporte.

Pour explorer une base de code inconnue, un agent de recherche en lecture seule évite de charger un contexte volumineux dans la session principale.

## Ce que ce dépôt fournit à un agent

```
CLAUDE.md                   règles permanentes, lues à chaque session
docs/specs/SPEC-XXX.md      le contrat de ce qui doit être construit
docs/adr/                   pourquoi les choix sont ce qu'ils sont
docs/architecture/          où va quoi, et sous quelles contraintes
docs/engineering/           comment écrire, tester, livrer
docs/ai/workflow-tache.md   la boucle à suivre pour chaque tâche
docs/ai/prompts/            des points de départ réutilisables
```

Si un agent produit du code inadapté, la première question à se poser n'est pas « quel mauvais agent », mais **« qu'est-ce qui n'était pas écrit ? »**. Puis on l'écrit.
