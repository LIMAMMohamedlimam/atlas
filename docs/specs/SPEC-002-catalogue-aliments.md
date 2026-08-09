# SPEC-002 — Catalogue d'aliments : recherche, scan, création

**Statut :** Brouillon
**Jalon :** M2
**Dépend de :** SPEC-001
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Trouver un aliment le plus vite possible, par trois chemins : les aliments déjà utilisés (hors ligne), la recherche en ligne (Open Food Facts, USDA), et le scan de code-barres. Et permettre de créer soi-même un aliment quand aucune source ne l'a.

C'est la fonctionnalité la plus difficile de l'app : c'est elle qui fait la réputation de MyFitnessPal, et c'est là que la plupart des clones échouent.

## 2. Hors périmètre

- Le pipeline technique de normalisation des sources → [food-data-pipeline.md](../architecture/food-data-pipeline.md)
- Les recettes composées → [SPEC-004](SPEC-004-recettes-et-repas.md)
- Les micronutriments détaillés → backlog

## 3. Parcours utilisateur

Depuis un créneau de repas, l'utilisateur tape « Ajouter ». Il arrive sur un écran de recherche avec trois onglets : **Fréquents**, **Récents**, **Mes aliments**, et une barre de recherche en haut avec une icône de scan. Tant qu'il n'a rien tapé, il voit ses aliments fréquents — c'est le cas le plus courant et il ne nécessite aucun réseau. Dès qu'il tape, la recherche locale filtre instantanément, puis les résultats en ligne arrivent en dessous, dans une section séparée.

## 4. Règles métier

### Recherche

> **RG-1** — La recherche locale s'exécute à chaque frappe, sans délai. La recherche en ligne est déclenchée après **400 ms sans frappe** et au minimum **3 caractères**.

> **RG-2** — Les résultats sont affichés en sections ordonnées : `Mes aliments` → `Récents` → `Base en ligne`. On ne mélange jamais local et distant dans une même liste : l'utilisateur doit savoir d'où vient une donnée.

> **RG-3** — Classement des « Fréquents » : nombre d'utilisations sur les **60 derniers jours**, à égalité la plus récente d'abord. Recalculé à l'ouverture de l'écran.

> **RG-4** — Un aliment issu d'une source en ligne est **copié dans la base locale** dès qu'il est utilisé une première fois. Il devient alors disponible hors ligne pour toujours.

> **RG-5** — Chaque résultat affiche visiblement sa provenance (`OFF`, `USDA`, `Perso`) et, pour Open Food Facts, un indicateur de complétude des données.

### Scan de code-barres

> **RG-6** — Le scan cherche d'abord dans la base locale (instantané, hors ligne), puis sur Open Food Facts, puis sur USDA. Premier résultat trouvé, on s'arrête.

> **RG-7** — Formats acceptés : EAN-13, EAN-8, UPC-A, UPC-E. Les autres formats (QR, Code 128) sont ignorés silencieusement.

> **RG-8** — Si aucune source ne connaît le code, proposer la création d'un aliment personnel avec le code-barres pré-rempli. Ne jamais laisser l'utilisateur dans une impasse.

> **RG-9** — La permission caméra est demandée **au premier scan**, avec une explication préalable de ce à quoi elle sert. Si elle est refusée, la recherche textuelle reste pleinement utilisable.

### Normalisation

> **RG-10** — Toutes les valeurs nutritionnelles sont stockées **pour 100 g** (aliments solides) ou **100 ml** (liquides), quelle que soit la source.

> **RG-11** — Un aliment sans valeur énergétique exploitable est **rejeté à l'import** : il n'entre pas dans la base locale.

> **RG-12** — Les valeurs aberrantes sont rejetées : énergie > 900 kcal/100 g, ou somme (protéines + glucides + lipides) > 105 g pour 100 g. Ces produits sont mal saisis à la source ; les importer pollue durablement la base de l'utilisateur.

> **RG-13** — Le sodium et le sel sont convertis dans une seule unité canonique (sel en g, `sel = sodium × 2,5`), avec la source d'origine conservée.

### Aliments personnels

> **RG-14** — Champs obligatoires à la création : nom, unité de base (g ou ml), énergie, protéines, glucides, lipides. Tout le reste est facultatif.

> **RG-15** — Un aliment personnel est modifiable et supprimable. Sa suppression est logique et n'affecte aucune entrée de journal existante (RG-3 de SPEC-001).

> **RG-16** — Un aliment issu d'une source en ligne peut être **dupliqué en aliment personnel** pour correction, mais jamais modifié en place : on ne réécrit pas une donnée partagée.

### Portions

> **RG-17** — Chaque aliment peut porter des portions nommées (`1 tranche = 30 g`). Les portions issues d'OFF (`serving_size`) sont importées quand elles sont exploitables.

> **RG-18** — La portion proposée par défaut est **celle utilisée la dernière fois par l'utilisateur pour cet aliment**. À défaut, la portion de la source. À défaut, 100 g.

## 5. Critères d'acceptation

```
CA-1  Aliments fréquents hors ligne
  Étant donné  15 aliments déjà utilisés et l'appareil en mode avion
  Quand        j'ouvre l'écran d'ajout d'aliment
  Alors        l'onglet Fréquents affiche mes aliments les plus utilisés
  Et           aucune erreur réseau n'est affichée

CA-2  Recherche locale instantanée
  Étant donné  un aliment local nommé « Poulet rôti »
  Quand        je tape « poul »
  Alors        « Poulet rôti » apparaît en moins de 100 ms dans la section « Récents »

CA-3  Recherche en ligne
  Étant donné  une connexion active
  Quand        je tape « nutella » et attends 400 ms
  Alors        une section « Base en ligne » se remplit avec des résultats OFF
  Et           chaque résultat indique sa marque et ses kcal/100 g

CA-4  Réseau indisponible pendant une recherche
  Étant donné  l'appareil hors ligne
  Quand        je tape « nutella »
  Alors        les résultats locaux s'affichent normalement
  Et           la section en ligne affiche « Hors ligne — résultats locaux uniquement »
  Et           aucune erreur bloquante n'apparaît

CA-5  Scan réussi
  Étant donné  un produit présent sur Open Food Facts
  Quand        je scanne son code-barres
  Alors        sa fiche s'affiche en moins de 2 s avec nom, marque et macros
  Et           l'aliment est enregistré en base locale après validation

CA-6  Scan d'un code inconnu
  Étant donné  un code-barres absent de toutes les sources
  Quand        je le scanne
  Alors        l'app propose « Créer cet aliment »
  Et           le formulaire s'ouvre avec le code-barres déjà rempli

CA-7  Rejet de données aberrantes
  Étant donné  un produit OFF déclarant 1500 kcal / 100 g
  Quand        il apparaît dans les résultats
  Alors        il est filtré et n'est pas proposé

CA-8  Cache local
  Étant donné  un produit scanné et utilisé hier avec connexion
  Quand        je le scanne à nouveau en mode avion
  Alors        sa fiche s'affiche depuis la base locale, sans appel réseau

CA-9  Création d'un aliment personnel
  Étant donné  le formulaire de création
  Quand        je saisis « Ma protéine » 380 kcal, 75 P, 8 G, 5 L pour 100 g et valide
  Alors        l'aliment est disponible dans « Mes aliments »
  Et           il est utilisable immédiatement dans le journal

CA-10 Portion mémorisée
  Étant donné  que j'ai déjà ajouté cet aliment en « 1 tranche (30 g) »
  Quand        je le sélectionne à nouveau
  Alors        la portion « 1 tranche » et la quantité 1 sont pré-sélectionnées

CA-11 Permission caméra refusée
  Étant donné  que je refuse la permission caméra
  Quand        je reviens sur l'écran de recherche
  Alors        la recherche textuelle fonctionne normalement
  Et           l'icône de scan propose d'ouvrir les réglages du système
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| API OFF lente (> 5 s) | Abandonner la requête, afficher les résultats locaux, proposer « Réessayer ». |
| API OFF renvoie une erreur 5xx | Message discret, pas de blocage. Réessai automatique une seule fois. |
| Limite de débit atteinte | Espacer les requêtes, informer sobrement. Ne jamais boucler sur des réessais. |
| Produit OFF avec un nom vide | Rejeté (RG-11 ne suffit pas : un aliment sans nom est inutilisable). |
| Deux sources renvoient le même code-barres | Priorité : aliment perso > OFF > USDA. |
| Code-barres mal lu (1 chiffre faux) | Rien à faire côté app : la somme de contrôle EAN est vérifiée par le décodeur, un code invalide est ignoré. |
| Recherche renvoyant 500 résultats | Pagination : 25 par page, chargement à la demande. |
| L'utilisateur crée un doublon d'un aliment existant | Autorisé. Détecter les noms très proches et proposer « Vouliez-vous dire… ? » sans bloquer. |
| Base locale > 20 000 aliments | La recherche locale reste < 100 ms grâce à l'index FTS5. |

## 7. Données

Tables : `foods`, `food_portions`, `food_usage_stats`.
Recherche plein texte : table virtuelle **FTS5** `foods_fts` synchronisée par triggers SQLite.
Détails : [data-model.md](../architecture/data-model.md#nutrition) et [food-data-pipeline.md](../architecture/food-data-pipeline.md).

## 8. Interface

```
┌─────────────────────────────────┐
│ ← [ 🔍 chercher un aliment  ] 📷 │
├─────────────────────────────────┤
│ Fréquents  │ Récents │ Mes aliments│
├─────────────────────────────────┤
│  Flocons d'avoine        Perso  │
│  380 kcal / 100 g            +  │
├─────────────────────────────────┤
│  Skyr nature          OFF ●●●○  │
│  Danone · 63 kcal / 100 g    +  │
└─────────────────────────────────┘
```

L'indicateur `●●●○` traduit la complétude des données OFF (macros présentes, portion connue, image, etc.).

États : vide sans historique (« Scannez votre premier produit »), chargement en ligne (squelettes, pas de spinner plein écran), aucun résultat (proposer la création).

## 9. Performance et accessibilité

- Recherche locale : **< 100 ms** pour 20 000 aliments.
- Ouverture de la caméra : **< 800 ms**.
- Reconnaissance d'un code-barres net : **< 1 s**.
- Le scan doit fonctionner en faible luminosité : proposer l'activation de la lampe.
- Chaque résultat est annoncé au lecteur d'écran avec son nom, sa marque et ses calories.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Embarquer un « pack de démarrage » de ~2000 aliments courants dans l'APK, pour que l'app soit utile dès la première ouverture hors ligne ? Impact : +5 à 10 Mo, plus une obligation de conformité ODbL. *Proposition : oui, en fin de M2.*
- [ ] 2026-08-09 — Utiliser l'API Search-a-licious d'OFF ou l'endpoint de recherche historique ? `[À VÉRIFIER : comparer les deux au moment de l'implémentation]`
