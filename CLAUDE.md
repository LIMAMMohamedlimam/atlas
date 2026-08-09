# Instructions projet — Atlas

Ce fichier est lu automatiquement par Claude Code au démarrage de chaque session. Il s'applique aussi bien aux humains qu'aux agents IA.

## Contexte

App mobile Android de nutrition + musculation. **React Native + Expo, TypeScript strict, SQLite local via Drizzle ORM, aucun backend.**

Phase actuelle : **documentation**. Il n'y a pas encore de code. Ne pas créer de fichiers source tant qu'un jalon de `docs/plan/roadmap.md` n'a pas été explicitement ouvert.

## Langue

- Toute la **conversation et la documentation** : français, explications simples.
- Tout le **code** (identifiants, commentaires, messages de commit, noms de fichiers) : anglais.
- L'**interface utilisateur** : français par défaut, via les fichiers de traduction — jamais de texte en dur dans un composant.

## Avant d'écrire du code

1. Lire la spec concernée dans `docs/specs/`. Si elle n'existe pas, l'écrire d'abord et la faire valider.
2. Vérifier les ADR dans `docs/adr/` — les décisions techniques y sont déjà tranchées. Ne pas les remettre en cause sans en discuter.
3. Consulter `docs/architecture/data-model.md` avant toute modification du schéma de base.
4. Suivre le workflow de `docs/ai/workflow-tache.md`.

## Règles non négociables

**Données nutritionnelles**
- Ne **jamais** inventer une valeur nutritionnelle. Si une donnée est absente d'une source, elle reste `null` et l'UI affiche « non renseigné ». Un chiffre faux est pire qu'un chiffre manquant.
- Toutes les valeurs sont stockées **pour 100 g ou 100 ml**. La conversion vers une portion se fait à l'affichage, jamais en base.
- Une entrée du journal **fige une copie** des macros au moment de la saisie (`kcal_snapshot`, etc.). Si la fiche produit change ensuite, l'historique ne doit pas bouger.

**Conversions et calculs**
- Toute conversion d'unité (g/ml/oz/lb/kg) passe par `src/lib/units/`. Zéro conversion en ligne dans un composant.
- Toute formule (Mifflin-St Jeor, 1RM estimé, volume) vit dans `src/domain/` avec un test unitaire couvrant les cas limites.

**Base de données**
- Aucune modification de schéma sans une migration Drizzle **versionnée et testée**. Ne jamais éditer une migration déjà livrée.
- Toute table métier porte : `id` (UUIDv7, texte), `created_at`, `updated_at` (epoch ms UTC), `deleted_at` (suppression logique).
- Pas de `SELECT *` dans le code applicatif : on sélectionne les colonnes utilisées.

**Architecture**
- Les composants d'écran ne parlent jamais à la base directement. Ils passent par un *repository* (`src/data/repositories/`).
- Un fichier > 400 lignes est un signal de découpage.
- Pas de nouvelle dépendance npm sans justification écrite dans la PR (poids, maintenance, alternative native).

**Vie privée**
- Ce sont des données de santé. Aucune donnée personnelle ne sort de l'appareil sans action explicite de l'utilisateur. Pas d'analytics, pas de log de contenu de repas, pas d'envoi vers un service tiers.
- Les appels réseau autorisés sont uniquement : Open Food Facts et USDA FoodData Central, et seulement pour **chercher** un aliment (jamais pour envoyer les données de l'utilisateur).

**Sécurité des utilisateurs**
- Si un objectif calorique calculé descend sous un seuil de sécurité (voir `SPEC-003`), afficher un avertissement clair. Ne jamais proposer de déficit agressif par défaut.
- Aucun conseil médical. Bandeau d'avertissement dans l'onboarding et les paramètres.

## Commandes (à mettre à jour quand le projet sera initialisé)

```bash
# pas encore disponibles — phase documentation
npm run lint          # ESLint + Prettier
npm run typecheck     # tsc --noEmit
npm run test          # Jest + Testing Library
npm run db:generate   # génère une migration Drizzle depuis le schéma
```

## Définition de « terminé »

Une tâche n'est finie que si : les critères d'acceptation de la spec passent, `lint` + `typecheck` + `test` sont verts, la doc impactée est à jour, et le comportement a été vérifié sur un appareil ou un émulateur Android réel. Détail dans `docs/engineering/definition-of-done.md`.

## Ce qu'il ne faut pas faire

- Ne pas lancer de build EAS ou publier quoi que ce soit sans demande explicite.
- Ne pas ajouter de fonctionnalité « pendant qu'on y est » : hors périmètre = ticket dans `docs/plan/backlog.md`.
- Ne pas commiter de dump de données alimentaires dans Git (voir `.gitignore` et la stratégie d'assets).
