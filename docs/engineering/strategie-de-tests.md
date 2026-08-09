# Stratégie de tests

## Le principe

On ne teste pas pour atteindre un pourcentage de couverture. On teste **là où une erreur serait invisible et coûteuse**.

Dans cette application, la hiérarchie du risque est très nette :

| Zone | Si ça casse | Visibilité du bug | Priorité de test |
|---|---|---|---|
| Calculs nutritionnels | Des mois de données faussées | **Invisible** | Maximale |
| Mappers OFF/USDA | Base polluée durablement | Faible | Maximale |
| Conversions d'unités | Erreurs silencieuses partout | **Invisible** | Maximale |
| Migrations de base | Perte de données irréversible | Tardive | Maximale |
| Repositories | Données perdues ou mal filtrées | Moyenne | Élevée |
| Écrans | Interface cassée | **Immédiate** | Faible |

Un bouton mal aligné se voit en une seconde. Un total de calories faux de 8 % ne se voit **jamais** — et fausse toutes les décisions de l'utilisateur pendant des mois. C'est là qu'il faut mettre l'effort.

## La pyramide, adaptée à ce projet

```
        ╱╲          E2E — Maestro
       ╱  ╲         5 parcours critiques, lancés avant chaque release
      ╱────╲
     ╱      ╲       Intégration — repositories sur SQLite en mémoire
    ╱        ╲      ~40 tests
   ╱──────────╲
  ╱            ╲    Unitaires — domaine pur, mappers, unités, dates
 ╱______________╲   ~200 tests, exécution en moins de 5 secondes
```

## Niveau 1 — Tests unitaires (le cœur)

**Cible : `src/domain/`, `src/lib/`, `src/data/remote/*/mappers`.**

Aucun émulateur, aucune base, aucun réseau. Du TypeScript pur, exécuté en Node, en quelques secondes.

### Ce qui doit être testé, exhaustivement

**Nutrition**
- Mifflin-St Jeor, hommes et femmes, avec des valeurs de référence documentées.
- TDEE pour les 5 niveaux d'activité.
- Ajustements par objectif.
- **Plancher de sécurité** (RG-4 de SPEC-003) : au-dessus, en dessous, exactement dessus.
- Répartition des macros et vérification de cohérence à ±2 %.
- Snapshot d'une entrée : quantité × valeurs pour 100 g, avec des valeurs manquantes.
- Résolution portion → grammes, y compris portion inconnue.

**Entraînement**
- Volume : séries d'échauffement exclues, poids du corps, séries incomplètes.
- 1RM Epley, **et le refus au-delà de 12 répétitions**.
- Détection de records : premier record, égalité, régression.

**Unités**
- Aller-retour kg ↔ lb, cm ↔ pouces, g ↔ oz sans dérive.
- kJ → kcal.
- Sodium → sel.

**Dates** — le sujet le plus piégeux :
- Repas à 23 h 50 → bon jour local.
- Changement d'heure d'été.
- Changement de fuseau entre deux saisies.
- Tri lexicographique des jours `YYYY-MM-DD`.

**Mappers** — avec des fixtures issues de **vraies réponses d'API** :
- produit complet ;
- énergie en kJ uniquement ;
- énergie absente, macros présentes → estimation ;
- énergie et macros absentes → rejet ;
- valeurs aberrantes → rejet (999 kcal, somme de macros à 110 g) ;
- `serving_size` illisible → pas de portion, sans erreur ;
- nom vide → rejet ;
- sel absent, sodium présent → conversion.

### Style

```ts
describe('calculateBMR', () => {
  // Valeur de référence : SPEC-003 CA-1
  it('applique Mifflin-St Jeor pour un homme', () => {
    expect(calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 }))
      .toBeCloseTo(1780, 0);
  });
});
```

Chaque test cite la règle métier qu'il vérifie (`RG-x`, `CA-x`). Un test sans référence traçable est un test dont on ne saura pas s'il faut le modifier quand la spec change.

## Niveau 2 — Tests d'intégration

**Cible : `src/data/repositories/` et les migrations.**

Base SQLite **en mémoire**, recréée pour chaque test. Rapide, isolé, déterministe.

À couvrir :
- Écriture puis lecture d'une entrée de journal.
- Le filtre `deleted_at IS NULL` est appliqué **partout** — un oubli fait réapparaître des données supprimées.
- Totaux du jour avec valeurs manquantes.
- Objectif applicable à une date (le bon parmi plusieurs historisés).
- Recherche FTS5 : accents, casse, correspondance partielle.
- Une seule mesure corporelle par jour (index unique).
- Une seule séance active à la fois.
- Récupération de la dernière performance sur un exercice.

**Migrations** — spécifiquement :
- Chaque migration s'applique sur une base de la version précédente **remplie de données réalistes**.
- Aucune perte de données.
- La migration est idempotente si elle est rejouée.

C'est le test le plus important du projet : sans serveur, une migration ratée détruit les données de l'utilisateur sans aucun recours.

## Niveau 3 — Tests de composants

**Cible : les composants à logique d'affichage non triviale uniquement.**

`@testing-library/react-native`, avec les repositories simulés.

On teste : les états vide / chargement / erreur, l'affichage des valeurs manquantes (« — » et non « 0 »), le message de dépassement d'objectif, l'accessibilité des éléments clés.

On **ne teste pas** : les styles, la mise en page, le rendu pixel. Ça change tout le temps et ça se voit à l'œil.

## Niveau 4 — Tests E2E (Maestro)

Cinq parcours seulement, correspondant aux parcours critiques du [périmètre v1](../product/perimetre-v1.md) :

1. Onboarding → définir un objectif → premier aliment enregistré.
2. Ajouter un aliment fréquent au journal (hors ligne).
3. Créer un aliment personnel et l'utiliser.
4. Démarrer une séance, valider trois séries, terminer.
5. Exporter puis réimporter, en vérifiant l'égalité des totaux.

Lancés avant chaque release, pas à chaque commit — ils sont lents et fragiles par nature.

## Ce qu'on ne teste pas

- Le rendu visuel (pas de tests de capture d'écran en v1 : trop de faux positifs pour un projet solo).
- Les bibliothèques tierces.
- Les getters et setters triviaux.
- **Les vraies API OFF/USDA en CI.** Un test de contrat manuel existe, lancé à la demande.

## Données de test

- Fixtures dans `__fixtures__/`, avec des **réponses d'API réelles** anonymisées.
- Constructeurs d'objets de test (`makeFood()`, `makeDiaryEntry()`) avec des valeurs par défaut réalistes, pour que les tests restent lisibles.
- **Aucune donnée réelle d'utilisateur** dans les fixtures.

## Exécution

| Quand | Quoi | Budget |
|---|---|---|
| À chaque sauvegarde (watch) | Unitaires du module modifié | instantané |
| Avant chaque commit (hook) | Lint + typecheck + unitaires | < 30 s |
| En CI, sur chaque PR | Tout sauf E2E | < 3 min |
| Avant chaque release | + E2E Maestro | < 15 min |

**Si la suite unitaire dépasse 10 secondes, c'est qu'un test touche à de l'I/O.** Il faut le déplacer d'un niveau.

## Couverture

Pas d'objectif global. Deux seuils **bloquants** en CI :

- `src/domain/` : **90 %**
- `src/data/remote/*/mappers` : **90 %**

Le reste n'est pas mesuré. Un pourcentage global élevé obtenu en testant des composants triviaux donne un faux sentiment de sécurité et détourne l'effort de là où il compte.

## Rôle des agents IA

Écrire des tests est une tâche que les agents font bien, à condition d'être cadrés :

- **Les critères d'acceptation des specs sont le contrat.** Un agent implémente contre `CA-1`, `CA-2`… et chaque critère devient un test nommé explicitement.
- Toujours demander les **cas limites** avec l'implémentation : c'est là que les agents sont utiles et les humains distraits.
- **Vérifier que le test échoue avant la correction.** Un test écrit après coup qui passe du premier coup ne prouve rien — voir [workflow-tache.md](../ai/workflow-tache.md).
