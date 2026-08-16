# Backlog

Tout ce qui est volontairement écarté de la v1. Ce fichier existe pour une seule raison : **pouvoir dire non sans perdre l'idée**.

Règle d'usage : quand une idée apparaît en cours de développement, elle vient ici **immédiatement**, avec sa date. On ne l'implémente pas « pendant qu'on y est ».

Format : `[date] Titre — description courte. Valeur / Coût.`

---

## Post-v1 — forte valeur

- **[2026-08-09] Synchronisation chiffrée multi-appareils** — serveur minimal, chiffrement de bout en bout, résolution « le plus récent gagne ». C'est la vraie limite de la v1 : sans elle, perdre son téléphone sans export = tout perdre. *Valeur : élevée. Coût : élevé (4-6 sem. + infrastructure).*

- **[2026-08-09] Portage iOS** — la stack le permet sans réécriture. Reste à faire : adaptations d'interface, permissions, publication App Store. *Valeur : élevée si d'autres utilisateurs. Coût : moyen (2-3 sem.).*

- **[2026-08-09] Import MyFitnessPal / Strong / Hevy** — analyse de leurs exports CSV. Enlève le principal frein au changement d'app. *Valeur : élevée pour l'adoption. Coût : moyen, un analyseur par format.*

- **[2026-08-09] Health Connect** — lire le poids et l'activité depuis d'autres apps et balances connectées, écrire les séances. *Valeur : moyenne. Coût : moyen, module natif probable.*

## Post-v1 — valeur moyenne

- **[2026-08-09] Micronutriments détaillés** — vitamines, minéraux. Le modèle est prêt (colonnes principales), il manque une table clé/valeur et l'interface. *Valeur : moyenne, public restreint. Coût : moyen.*

- **[2026-08-09] Objectifs variables selon les jours** — plus de glucides les jours d'entraînement. Demandé par les pratiquants avancés. *Valeur : moyenne. Coût : moyen (le modèle d'objectifs devient plus complexe).*

- **[2026-08-09] Progression automatique des charges** — proposer +2,5 kg quand la fourchette de répétitions est atteinte. *Valeur : moyenne. Coût : moyen. Attention à ne pas glisser vers le coaching.*

- **[2026-08-09] Photos de progression** — stockage local, comparaison avant/après. *Valeur : moyenne. Coût : moyen, avec un vrai sujet de sensibilité des données.*

- **[2026-08-09] Estimation du TDEE réel** — déduire la dépense réelle de l'historique poids + calories. Bien plus précis qu'une formule après 6 semaines de données. *Valeur : élevée pour la cible. Coût : faible en calcul, élevé en présentation honnête de l'incertitude.*

- **[2026-08-09] Widgets écran d'accueil** — calories restantes, séance du jour. *Valeur : moyenne. Coût : moyen, module natif.*

## Post-v1 — valeur faible ou à démontrer

- **[2026-08-09] Wear OS** — valider ses séries depuis la montre. *Valeur : faible pour la cible. Coût : élevé.*
- **[2026-08-09] Import de recettes depuis une URL** — analyse de pages web, fiabilité douteuse. *Valeur : faible. Coût : élevé.*
- **[2026-08-09] Listes de courses depuis les recettes** — hors du cœur du produit.
- **[2026-08-09] Reconnaissance de repas par photo** — précision insuffisante, coût par requête, et cela contredirait le principe « aucune donnée ne sort de l'appareil ».
- **[2026-08-09] Plans d'entraînement générés** — un produit à part entière, pas une fonctionnalité.
- **[2026-08-09] Fonctions sociales** — explicitement hors vision produit.
- **[2026-08-09] Suivi cardio GPS** — hors cible.

## Améliorations techniques différées

- **[2026-08-16] Parcours E2E Maestro (5 parcours, `definition-of-done.md:65`)** — exigés pour clore un jalon, mais Maestro n'est pas installé et aucun dossier `.maestro/` n'existe. Reporté explicitement ici plutôt que silencieusement omis (règle de la mauvaise foi). *Coût : moyen (installation + 5 scripts + un run en CI). À faire avant la sortie v1.*
- **[2026-08-09] Chiffrement de la base (SQLCipher)** — à reconsidérer si un verrouillage de l'app est ajouté. Voir [security-privacy.md](../architecture/security-privacy.md#stockage).
- **[2026-08-09] Totaux quotidiens matérialisés** — uniquement si les mesures montrent un dépassement du budget de 100 ms.
- **[2026-08-09] Tests de rendu visuel** — trop de faux positifs pour un projet solo, à revoir si l'interface se stabilise.
- **[2026-08-09] Rapport de plantage opt-in** — utile pour debugger à distance, avec une garantie stricte d'absence de données métier.
- **[2026-08-09] Verrouillage par empreinte** — données de santé, mais frottement quotidien réel.

## Décisions reportées

Ces points sont à trancher au moment indiqué, pas avant :

| Quoi | Quand | Où |
|---|---|---|
| Bibliothèque de graphiques | Début M5 | ADR à écrire |
| Format et chiffrement de l'export | Début M6 | ADR à écrire |
| Pack de démarrage d'aliments | Fin M2 | SPEC-002 §10 |
| Source du jeu d'exercices intégré | Début M4 | SPEC-006 §10 |
| Katch-McArdle en option | Après M1 | SPEC-003 §10 |

---

## Idées rejetées définitivement

À ne pas ressortir, avec la raison :

- **Publicité** — sur des données de santé, non. Contredit la vision produit.
- **Vente ou partage de données** — jamais.
- **Abonnement pour des fonctions de base** — c'est précisément le reproche fait à MyFitnessPal.
- **Streaks sur la saisie alimentaire** — transforme un oubli en échec. Voir [security-privacy.md](../architecture/security-privacy.md#sécurité-de-lutilisateur-au-delà-des-données).
- **Notifications de rappel insistantes** — même raison.
