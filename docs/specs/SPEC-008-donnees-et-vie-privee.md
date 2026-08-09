# SPEC-008 — Export, import, sauvegarde et effacement

**Statut :** Brouillon
**Jalon :** M6
**Dépend de :** toutes les specs précédentes
**Dernière mise à jour :** 2026-08-09

## 1. Objectif

Garantir que l'utilisateur n'est jamais prisonnier de l'application : il peut récupérer l'intégralité de ses données, les restaurer sur un autre appareil, et tout effacer. Sans compte, sans serveur, c'est la seule protection contre la perte d'un téléphone — donc une fonctionnalité de survie, pas un confort.

## 2. Hors périmètre

- La synchronisation automatique multi-appareils → v2, voir [local-first-et-sync.md](../architecture/local-first-et-sync.md)
- L'import depuis MyFitnessPal / Strong → backlog

## 3. Parcours utilisateur

Paramètres → Mes données. Trois actions : **Exporter** (produit un fichier partageable), **Importer** (depuis un fichier d'export), **Tout effacer**. Une sauvegarde automatique hebdomadaire peut être activée, écrivant dans un dossier choisi par l'utilisateur.

## 4. Règles métier

### Export

> **RG-1** — L'export produit une **archive ZIP** contenant :
> - `atlas-export.json` — toutes les tables, format documenté et versionné ;
> - `manifest.json` — version du format, version de l'app, version du schéma de base, date, nombre d'enregistrements par table ;
> - un dossier `csv/` avec un fichier par domaine (`diary.csv`, `workouts.csv`, `measurements.csv`), pour l'usage en tableur.

> **RG-2** — Le JSON est la **source de vérité** pour un réimport. Les CSV sont un confort de lecture, non réimportables.

> **RG-3** — L'export contient **toutes** les données, y compris les enregistrements marqués supprimés, afin qu'un import restaure un état identique.

> **RG-4** — L'export est déclenché par l'utilisateur et passe par le sélecteur de fichiers du système. L'app n'écrit jamais dans un emplacement partagé sans action explicite.

> **RG-5** — L'export peut être **chiffré par mot de passe** (option). Si le mot de passe est perdu, le fichier est irrécupérable — l'avertissement doit être explicite et confirmé.

### Import

> **RG-6** — L'import propose deux modes : **Remplacer** (efface tout puis restaure) et **Fusionner** (ajoute ce qui manque). Le mode Remplacer demande une confirmation forte.

> **RG-7** — En mode Fusionner, la clé de rapprochement est l'`id` (UUID). En cas de conflit, l'enregistrement au `updated_at` le plus récent gagne.

> **RG-8** — Un import venant d'une version de schéma antérieure est **migré** au schéma courant avant application. Un import venant d'une version **plus récente** est refusé avec un message clair.

> **RG-9** — L'import est **transactionnel** : soit tout s'applique, soit rien. Une sauvegarde automatique de l'état courant est créée avant tout import.

> **RG-10** — Un fichier invalide ou corrompu est rejeté avec un message précisant ce qui a échoué, sans modifier la base.

### Sauvegarde automatique

> **RG-11** — Option désactivée par défaut. Une fois activée, une sauvegarde hebdomadaire s'écrit dans le dossier choisi, en conservant les **4 dernières** (rotation).

> **RG-12** — La sauvegarde s'exécute via `WorkManager` (contraintes : appareil en charge ou batterie suffisante). Elle ne doit jamais s'exécuter pendant une séance active.

> **RG-13** — L'app affiche la date de la dernière sauvegarde réussie et alerte discrètement au-delà de 30 jours sans sauvegarde.

### Effacement

> **RG-14** — « Tout effacer » supprime physiquement la base et les fichiers de l'app. La confirmation exige de saisir un mot (pas un simple « OK »).

> **RG-15** — Effacements partiels proposés : uniquement le journal nutritionnel, uniquement les séances, uniquement les aliments en cache.

> **RG-16** — L'app propose un export **avant** tout effacement total.

## 5. Critères d'acceptation

```
CA-1  Export complet
  Étant donné  une base avec 500 entrées de journal, 40 séances et 60 mesures
  Quand        j'exporte mes données
  Alors        un ZIP est produit contenant le JSON, le manifeste et les CSV
  Et           le manifeste indique les bons nombres d'enregistrements par table

CA-2  Aller-retour fidèle
  Étant donné  un export réalisé sur l'appareil A
  Quand        je l'importe en mode Remplacer sur une installation neuve
  Alors        toutes les entrées, séances, mesures, objectifs et aliments sont identiques
  Et           les totaux quotidiens affichés sont strictement les mêmes

CA-3  Import en fusion
  Étant donné  une base contenant les entrées de janvier
  Et           un export contenant janvier et février
  Quand        j'importe en mode Fusionner
  Alors        février est ajouté
  Et           les entrées de janvier ne sont pas dupliquées

CA-4  Conflit à la fusion
  Étant donné  une entrée locale modifiée aujourd'hui
  Et           la même entrée (même id) dans l'export, modifiée hier
  Quand        j'importe en mode Fusionner
  Alors        la version locale est conservée

CA-5  Import d'un fichier corrompu
  Étant donné  un ZIP tronqué
  Quand        je tente de l'importer
  Alors        un message d'erreur explicite s'affiche
  Et           la base locale est inchangée

CA-6  Import d'une version future
  Étant donné  un export produit par une version d'app plus récente
  Quand        je tente de l'importer
  Alors        l'import est refusé avec un message invitant à mettre l'app à jour

CA-7  Export chiffré
  Étant donné  l'option de chiffrement activée avec un mot de passe
  Quand        j'exporte puis tente de réimporter
  Alors        le mot de passe est demandé
  Et           un mot de passe erroné produit une erreur claire sans altérer la base

CA-8  Sauvegarde automatique
  Étant donné  la sauvegarde hebdomadaire activée depuis 5 semaines
  Quand        je consulte le dossier de sauvegarde
  Alors        exactement 4 fichiers sont présents, les plus récents

CA-9  Effacement total
  Étant donné  une base remplie
  Quand        je choisis « Tout effacer », que l'app me propose d'exporter d'abord,
               et que je saisis le mot de confirmation
  Alors        l'app redémarre sur l'onboarding
  Et           aucune donnée précédente n'est accessible

CA-10 Aucune fuite réseau
  Étant donné  n'importe quelle opération d'export, d'import ou de sauvegarde
  Quand        j'inspecte le trafic réseau
  Alors        aucune requête sortante n'est émise
```

## 6. Cas limites et erreurs

| Situation | Comportement attendu |
|---|---|
| Espace disque insuffisant | Erreur avant écriture, avec la taille estimée nécessaire. |
| Export de 2 ans de données (fichier volumineux) | Écriture en flux, jamais tout en mémoire. Indicateur de progression. |
| Import interrompu (app tuée) | La transaction est annulée au redémarrage ; base intacte. |
| Dossier de sauvegarde devenu inaccessible (carte SD retirée) | Sauvegarde désactivée avec notification, pas d'échec silencieux. |
| Import d'un export généré par un autre utilisateur | Autorisé en mode Remplacer ; interdit en Fusionner (mélange de profils). |
| Deux appareils exportant/important en boucle | Fonctionne, mais ce n'est pas de la synchronisation : le documenter clairement. |

## 7. Données

Toutes les tables. Le format d'export est spécifié dans `docs/architecture/export-format.md` (à rédiger au début de M6) et versionné indépendamment du schéma de base.

## 8. Interface

Écran « Mes données » listant : dernière sauvegarde, taille de la base, nombre d'enregistrements par domaine, puis les actions. Les actions destructrices sont visuellement distinctes et placées en bas.

## 9. Performance et accessibilité

- Export de 50 000 enregistrements : **< 10 s**, avec progression.
- Import : **< 30 s** pour le même volume.
- Aucun blocage de l'interface : traitement hors du thread principal.

## 10. Questions ouvertes

- [ ] 2026-08-09 — Chiffrement : AES-256-GCM avec dérivation de clé par mot de passe. Choisir la bibliothèque compatible React Native et consigner en ADR.
- [ ] 2026-08-09 — Faut-il désactiver la sauvegarde automatique Android (`android:allowBackup`) pour éviter qu'une base de données de santé ne parte sur Google Drive à l'insu de l'utilisateur ? *Proposition : oui, la désactiver et fournir notre propre mécanisme, c'est plus honnête.*
