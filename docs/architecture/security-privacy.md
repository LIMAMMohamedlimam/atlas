# Sécurité et vie privée

## Le point de départ

Cette application manipule des **données de santé** : poids, mensurations, alimentation, activité physique. Sous le RGPD, ce sont des données sensibles au sens de l'article 9 — la catégorie la plus protégée, au même titre que les données médicales.

La bonne nouvelle : en v1, **elles ne quittent jamais l'appareil**. C'est la mesure de protection la plus efficace qui existe, et elle est gratuite. Tout le reste de ce document consiste à ne pas gâcher cet avantage.

## Principes

1. **Le local par défaut.** Aucune donnée personnelle n'est transmise, à personne, sans action explicite de l'utilisateur.
2. **Minimisation.** On ne demande que ce qui sert. L'année de naissance suffit — pas la date exacte. Le champ « sexe » est facultatif et sert uniquement de paramètre à une formule ; il doit être expliqué comme tel.
3. **Zéro télémétrie par défaut.** Pas d'analytics, pas de traçage, pas de suivi d'usage. Si un jour un rapport de plantage est ajouté, il sera **opt-in**, sans aucune donnée métier.
4. **Transparence vérifiable.** L'écran « Vie privée » liste les seuls appels réseau que fait l'app. Un utilisateur curieux doit pouvoir le vérifier avec un inspecteur de trafic et ne rien trouver d'autre.
5. **Réversibilité.** Export complet et effacement total accessibles en trois taps.

## Ce qui sort de l'appareil, exhaustivement

| Vers | Quoi | Quand |
|---|---|---|
| Open Food Facts | Un terme de recherche, ou un code-barres | Uniquement quand l'utilisateur cherche ou scanne |
| USDA FoodData Central | Un terme de recherche | Idem |

**C'est tout.** Aucune donnée de journal, de poids, de séance ou de profil n'est envoyée nulle part.

Nuance à assumer et à écrire dans la politique de confidentialité : un terme de recherche alimentaire est **en soi** une information sur l'utilisateur, et l'adresse IP est visible du serveur interrogé. C'est inévitable dès qu'on interroge une base distante. On le dit, plutôt que de prétendre à un anonymat total.

## Permissions Android

| Permission | Usage | Quand elle est demandée |
|---|---|---|
| `CAMERA` | Scan de code-barres uniquement | Au premier scan, avec une explication préalable |
| `INTERNET` | Recherche d'aliments uniquement | Implicite |
| `POST_NOTIFICATIONS` | Chrono de repos, séance active | Au premier démarrage de séance |
| `FOREGROUND_SERVICE` | Maintenir le chrono en arrière-plan | Implicite |

**Aucune** permission de localisation, de contacts, de microphone, ni d'accès au stockage étendu. L'export passe par le sélecteur de fichiers du système (Storage Access Framework), qui ne nécessite pas de permission large.

Règle de conception : une permission refusée ne casse jamais l'app. Caméra refusée → recherche textuelle. Notifications refusées → chrono à l'écran.

## Stockage

- Base SQLite dans le stockage privé de l'app (`/data/data/<package>/`), inaccessible aux autres applications sur un appareil non rooté.
- **`android:allowBackup="false"`** — sinon la sauvegarde automatique Android peut copier une base de données de santé sur le Google Drive de l'utilisateur sans qu'il l'ait demandé. On fournit notre propre mécanisme d'export, explicite (SPEC-008).
- **`android:dataExtractionRules`** configuré pour exclure la base des transferts d'appareil à appareil.
- Chiffrement de la base (SQLCipher) : **non retenu en v1**. Le stockage privé est déjà chiffré au repos par Android sur un appareil verrouillé. SQLCipher ajouterait une gestion de clé, un impact sur les performances, et une dépendance native lourde, pour un gain réel limité. À reconsidérer si un verrouillage par code de l'app est ajouté. `[À VÉRIFIER : compatibilité SQLCipher avec expo-sqlite si le besoin apparaît]`

## Secrets et code

- La clé API USDA est injectée au build via une variable d'environnement, pas commitée. Une clé embarquée dans une app mobile est **extractible** : ce n'est pas un secret fort, on ne fait que ne pas la publier. Le jour où cela pose problème, la seule vraie solution est un proxy — donc un serveur, donc la v2.
- `.env`, fichiers de signature (`*.keystore`, `*.jks`) et profils de build sont dans `.gitignore`.
- Aucune donnée réelle d'utilisateur dans les fixtures de test.
- Les journaux (`console.log`) ne doivent jamais contenir de contenu de repas, de poids, ni de mensuration. Une règle ESLint interdit `console.log` en production.

## Conformité Play Store

| Exigence | Notre situation |
|---|---|
| Formulaire « Sécurité des données » | Déclarer : aucune donnée collectée, aucune donnée partagée. C'est vrai, et c'est un argument commercial. |
| Politique de confidentialité (URL publique obligatoire) | À rédiger avant la publication. Doit mentionner explicitement les appels OFF/USDA. |
| Applications de santé et forme physique | Déclaration de catégorie. Pas de revendication médicale, pas de diagnostic, pas de traitement. |
| Contenu pour tous publics | L'app n'est pas destinée aux enfants. RG-5 de SPEC-003 restreint le calcul d'objectifs aux 16 ans et plus. |
| Tests fermés préalables pour les nouveaux comptes développeur personnels | Google impose une période de test avec un nombre minimum de testeurs. `[À VÉRIFIER : règles en vigueur au moment de la publication — elles changent régulièrement]` À anticiper dès M5, pas la veille de la sortie. |

## Sécurité de l'utilisateur (au-delà des données)

Une app de comptage de calories peut faire du mal. Ce n'est pas un sujet théorique : les applications de tracking sont régulièrement mises en cause dans les parcours de troubles du comportement alimentaire. On ne peut pas résoudre le problème, mais on peut ne pas l'aggraver.

Ce qu'on met en place :

- **Plancher calorique** avec avertissement explicite (RG-4 de SPEC-003).
- **Pas de calcul d'objectif pour les moins de 16 ans** (RG-5 de SPEC-003).
- **Aucun message culpabilisant.** Un dépassement d'objectif s'affiche factuellement (« 200 au-dessus »), sans rouge alarmant, sans emoji triste, sans notification de rappel insistante (CA-9 de SPEC-001).
- **Pas de séries de jours consécutifs (streaks) sur l'alimentation.** Le mécanisme est efficace pour l'engagement et néfaste ici : il transforme un oubli en échec. Les streaks d'entraînement sont acceptables ; ceux de saisie alimentaire ne le sont pas.
- **Avertissement « ceci n'est pas un conseil médical »** dans l'onboarding et l'écran « À propos ».

## Ce qui déclenche une revue de sécurité

Une revue explicite (avec la skill `/security-review` ou une relecture dédiée) est obligatoire avant de fusionner une PR qui :

- ajoute un appel réseau ;
- ajoute une permission Android ;
- touche à l'export, l'import ou le chiffrement ;
- ajoute une dépendance qui accède au réseau, au stockage ou aux capteurs ;
- modifie les fichiers de configuration du manifeste Android.

## Points à trancher

- [ ] Verrouillage de l'app par empreinte ou code — utile pour des données de santé, mais frottement quotidien. *Proposition : option désactivée par défaut, en M6 ou plus tard.*
- [ ] Rapport de plantage opt-in en M6 ? Sans lui, on debugge à l'aveugle. Avec lui, il faut garantir l'absence de données métier dans les traces.
- [ ] Rédaction de la politique de confidentialité — à faire au début de M6, pas la veille de la publication.
