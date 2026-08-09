# Local-first, et préparation à la synchronisation

## La décision

**Aucun serveur en v1.** Toutes les données vivent dans une base SQLite sur le téléphone. Pas de compte, pas de connexion, pas de RGPD à gérer, pas d'infrastructure à payer.

Mais le schéma est conçu **dès maintenant** pour qu'une synchronisation puisse être ajoutée en v2 sans migration douloureuse. C'est un compromis très bon marché : quatre colonnes et une convention d'identifiants, décidées au départ, contre plusieurs semaines de reprise si on les oublie.

## Ce que « local-first » implique concrètement

1. **Chaque écran doit fonctionner en mode avion**, sauf la recherche en ligne d'aliments.
2. **Aucun indicateur de chargement** sur une opération locale : une lecture SQLite prend moins d'une milliseconde.
3. **Aucune donnée n'est perdue** si l'app est tuée : on écrit en base au fil de l'eau, pas à la fin d'un formulaire.
4. **L'export est vital** ([SPEC-008](../specs/SPEC-008-donnees-et-vie-privee.md)) : sans serveur, perdre son téléphone = perdre ses données. C'est le prix du local-first, et il faut le compenser explicitement.

## Les quatre décisions qui rendent la sync possible plus tard

### 1. Identifiants UUIDv7, générés sur l'appareil

Un identifiant auto-incrémenté est ingérable dès qu'il y a deux appareils : l'appareil A et l'appareil B créent tous les deux une ligne `id = 42`. Un UUID généré localement n'a pas ce problème.

Pourquoi **v7** plutôt que v4 : un UUIDv7 commence par un horodatage, donc il est **triable par date de création** et se comporte bien comme clé d'index (les insertions restent séquentielles). Un UUIDv4 aléatoire fragmente les index B-tree.

### 2. `updated_at` sur chaque ligne

Sans horodatage de dernière écriture, impossible de savoir quelle version gagne lors d'un conflit. C'est la base de toute stratégie « le plus récent gagne ».

Époch **millisecondes UTC**, jamais une chaîne de caractères, jamais une heure locale.

### 3. Suppression logique (`deleted_at`)

Si l'appareil A supprime physiquement une ligne, l'appareil B — qui l'a encore — la recréera à la synchronisation suivante. Le « fantôme » revenu d'entre les morts est le grand classique du bug de sync.

Une ligne supprimée reste en base avec `deleted_at` renseigné. Bonus immédiat, sans aucun serveur : la fonction « Annuler » après une suppression (CA-5 de SPEC-001) devient triviale.

### 4. Table `sync_outbox`, remplie mais jamais lue

Chaque écriture inscrit une ligne dans `sync_outbox`. En v1, **rien ne la consomme**. C'est un journal des modifications qui existe pour deux raisons :

- le jour où on branche un serveur, l'historique est déjà là ;
- écrire les déclencheurs et vérifier qu'ils fonctionnent est bien plus simple maintenant que dans deux ans, sur un schéma devenu complexe.

Coût : quelques kilo-octets par mois, et une purge périodique des lignes `synced_at` renseignées.

## Ce qu'on ne fait PAS maintenant

| Écarté | Pourquoi |
|---|---|
| CRDT / résolution automatique fine des conflits | Complexité disproportionnée pour un usage mono-utilisateur. « Le plus récent gagne » suffira. |
| Vecteurs d'horloge, horloges de Lamport | Même raison. On pourra les ajouter si les conflits deviennent un vrai problème observé. |
| Journal des opérations complet (event sourcing) | Change tout le modèle. On perdrait la simplicité de lecture SQL, qui est notre atout principal. |
| Sync temps réel | Une app de suivi personnel n'a aucun besoin de temps réel. |

**Règle générale :** on prépare uniquement ce qui coûte cher à rétro-installer (identifiants, horodatages, suppressions logiques). On ne construit rien qu'on ne sait pas encore utiliser.

## Esquisse de la v2 (indicatif, non engageant)

Le jour venu, le plus probable :

- Un serveur simple (Postgres) avec un endpoint « pousse mes changements depuis le curseur X, renvoie les tiens ».
- Résolution **« le plus récent gagne » ligne par ligne**, avec `updated_at`.
- Chiffrement de bout en bout : la clé dérive d'une phrase de passe utilisateur, le serveur ne stocke que des octets opaques. C'est ce qui permet de tenir la promesse de vie privée même avec un cloud.
- Sync manuelle ou périodique, jamais permanente.

Les conflits réels seront rares : une seule personne, sur deux appareils, saisit rarement la même entrée en même temps.

## Le piège des dates, en détail

C'est **le** bug qui reviendra si on ne le cadre pas maintenant.

| Donnée | Type | Exemple | Pourquoi |
|---|---|---|---|
| Jour de journal | `TEXT` local | `2026-08-09` | Un repas à 23 h 50 à Paris appartient au 9 août, quoi qu'en dise UTC. |
| Instant de saisie | `INTEGER` epoch ms UTC | `1754769000000` | Ordonnancement, calcul de durées. |
| Date de séance | `TEXT` local | `2026-08-09` | Regroupement par semaine. |
| Début/fin de séance | `INTEGER` epoch ms UTC | | Calcul de durée, insensible au changement d'heure. |

Règles :

1. Le jour local se calcule **à partir du fuseau de l'appareil au moment de la saisie**, puis il est figé. Un voyage à New York ne réécrit pas l'historique.
2. Ne jamais convertir un jour de journal en timestamp pour le comparer. On compare des chaînes `YYYY-MM-DD`, qui se trient correctement en ordre lexicographique.
3. Toute cette logique vit dans `src/lib/date/`, avec des tests couvrant : changement d'heure d'été, passage de minuit, changement de fuseau entre deux saisies.

## Ce que ça coûte, honnêtement

- Perdre son téléphone sans export = perdre ses données. **C'est le vrai risque de la v1**, et c'est pour ça que la sauvegarde automatique (RG-11 de SPEC-008) mérite d'être livrée en M6 et pas repoussée.
- Pas de multi-appareils : téléphone + tablette ne se parlent pas.
- Pas de récupération de compte, puisqu'il n'y a pas de compte.

Ces limites sont acceptables **si elles sont dites clairement à l'utilisateur** — dans l'onboarding, pas enfouies dans les paramètres.
