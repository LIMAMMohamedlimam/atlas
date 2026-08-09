# Git, intégration continue et livraison

## Branches

Modèle volontairement simple, adapté à un projet solo :

```
main                    toujours livrable, protégée
  └── feat/SPEC-001-diary-day-screen
  └── fix/diary-total-rounding
  └── chore/upgrade-expo-sdk
```

- **Pas de branche `develop`.** Une seule branche longue, des branches courtes qui fusionnent vite.
- **Une branche par unité livrable**, pas par fonctionnalité entière. `SPEC-001` produit cinq branches, pas une.
- **Durée de vie maximale : 3 jours.** Au-delà, la branche diverge et la fusion devient risquée.
- `main` est protégée : pas de poussée directe, la CI doit être verte.

## Messages de commit

Format **Conventional Commits**, en anglais :

```
<type>(<portée>): <description à l'impératif>

<corps facultatif — le POURQUOI, pas le quoi>

Refs: SPEC-001 RG-3
```

Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`.

Exemples :

```
feat(diary): add day navigation with swipe gestures

Refs: SPEC-001 CA-7

fix(nutrition): stop rounding macros before summing

Rounding each entry before the sum caused a drift of up to 3 kcal
per day on days with many entries.

Refs: SPEC-001 RG-4
```

**Chaque commit référence la règle ou le critère qu'il implémente.** C'est ce qui permet, un an plus tard, de retrouver pourquoi une ligne existe.

## Pull requests

Même en solo, on passe par des PR. Raisons concrètes : elles forcent une relecture du diff complet, elles donnent un point d'ancrage à la CI et aux revues automatisées, et elles laissent une trace lisible de l'historique.

Modèle de description :

```markdown
## Quoi
Une phrase.

## Spec
SPEC-001, critères CA-3 et CA-4.

## Comment
Les choix d'implémentation qui méritent une explication.

## Vérifié
- [ ] Testé sur un appareil Android réel
- [ ] Testé en mode avion
- [ ] Cas limites de la spec traités
- [ ] Doc mise à jour si le comportement change

## Points d'attention pour la revue
Ce dont je ne suis pas sûr.
```

**Taille cible : moins de 400 lignes modifiées.** Au-delà, la relecture devient superficielle — humaine comme automatisée.

## Intégration continue (GitHub Actions)

### Sur chaque PR — `ci.yml`

```yaml
# à écrire en M0
jobs:
  quality:
    - checkout
    - setup node + cache
    - npm ci
    - npm run lint          # ESLint, erreurs bloquantes
    - npm run typecheck     # tsc --noEmit
    - npm run test:ci       # Jest + seuils de couverture domaine
    - npm run test:migrations
```

Budget : **moins de 3 minutes**. Au-delà, on cesse d'attendre la CI, et elle ne sert plus à rien.

### Sur `main` — `build.yml`

Build EAS en profil `preview` → APK installable, pour tester le vrai comportement sur appareil.

### Manuel — `contract-test.yml`

Interroge réellement les API OFF et USDA avec une poignée de codes-barres connus, pour détecter un changement de format. Jamais automatique : ce serait charger un service bénévole sans raison.

## Hooks locaux (husky + lint-staged)

**pre-commit** — sur les fichiers modifiés uniquement : Prettier, ESLint, `tsc --noEmit`. Budget : 10 secondes.

**pre-push** — la suite de tests unitaires. Budget : 30 secondes.

Un hook lent est un hook contourné. Si le budget explose, on allège le hook, on ne prend pas l'habitude de `--no-verify`.

## Versions

**SemVer** : `MAJEUR.MINEUR.CORRECTIF`.

- `MINEUR` — nouvelle fonctionnalité (fin de chaque jalon).
- `CORRECTIF` — corrections.
- `MAJEUR` — réservé à un changement de format de données non rétrocompatible.

Le `versionCode` Android s'incrémente à chaque build livré, sans exception.

Chaque version publiée est étiquetée (`v0.3.0`) et accompagnée d'une entrée dans `CHANGELOG.md`, écrite pour un utilisateur et non pour un développeur.

## Publication

| Profil EAS | Usage | Distribution |
|---|---|---|
| `development` | Développement quotidien | Development build local |
| `preview` | Vérification sur appareil | APK interne |
| `production` | Play Store | AAB signé |

Règles :
- **Aucun build de production sans demande explicite.** Un agent IA ne publie jamais.
- La clé de signature (`.keystore`) est gérée par EAS ou sauvegardée hors du dépôt. **La perdre rend toute mise à jour impossible** — l'application devient définitivement non-actualisable.
- Test fermé sur Play Console avant toute publication ouverte (voir aussi les [contraintes de publication](../architecture/security-privacy.md#conformité-play-store)).

## Ce qui ne va jamais dans Git

```gitignore
.env
.env.local
*.keystore
*.jks
node_modules/
.expo/
android/
ios/
/tools/build-seed-db/dumps/     # plusieurs gigaoctets de données OFF/USDA
*.db
*.sqlite
```

`android/` et `ios/` sont ignorés parce qu'on reste en workflow *managed* Expo (dossiers régénérés). S'il faut passer en *bare*, cette ligne saute et c'est une décision à consigner en ADR.

## Sauvegarde du dépôt

Un dépôt distant (GitHub, privé) dès le premier jour. Le code perdu se réécrit ; l'historique des décisions et la documentation, non.
