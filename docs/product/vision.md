# Vision produit

## Le problème

Les applications existantes font le travail, mais chacune a un défaut rédhibitoire :

- **MyFitnessPal** a la meilleure base d'aliments, mais met derrière un abonnement des fonctions basiques (scan de code-barres, macros par repas), affiche de la publicité, et ne suit pas la musculation sérieusement.
- **Strong / Hevy** sont excellents pour l'entraînement, mais ne gèrent pas la nutrition.
- Presque toutes exigent un compte et envoient des données de santé sur des serveurs tiers.

Résultat : la personne qui fait de la musculation et surveille son alimentation jongle entre **deux applications payantes** qui ne se parlent pas. Or les deux moitiés sont liées : on mange en fonction de ce qu'on soulève.

## Ce qu'on construit

Une application unique qui répond à trois questions :

1. **Qu'est-ce que j'ai mangé aujourd'hui, et où j'en suis de mes objectifs ?**
2. **Qu'est-ce que je fais à la salle aujourd'hui, et est-ce que je progresse ?**
3. **Est-ce que les deux vont dans le bon sens sur les 3 derniers mois ?**

## Utilisateur cible

**Le pratiquant régulier autonome.** Il s'entraîne 3 à 5 fois par semaine, connaît déjà les bases (séries, reps, macros), et suit un objectif précis : prise de masse, sèche, ou maintien. Il ne cherche pas un coach virtuel, il cherche un **outil de saisie rapide et un historique fiable**.

Ce qu'il fait aujourd'hui : un carnet papier ou une feuille Google Sheets pour l'entraînement, et une app gratuite pleine de pubs pour les calories.

**Non-cibles pour la v1** : les grands débutants qui ont besoin d'être guidés, les sportifs d'endurance (course, vélo), les personnes suivant un protocole médical.

## Les trois paris

**1. La vitesse de saisie est LA fonctionnalité.**
Une app de tracking qu'on abandonne au bout de deux semaines n'a aucune valeur. Tout le design part de là : ajouter un aliment déjà mangé la semaine dernière = 2 taps. Enregistrer une série identique à la précédente = 1 tap. Le chrono de repos démarre tout seul.

**2. Le local-first est un avantage, pas une limite.**
Pas de compte à créer, pas de latence réseau, ça marche au sous-sol de la salle où il n'y a pas de 4G. Et les données de santé restent sur le téléphone — c'est un argument, pas un compromis.

**3. Les deux moitiés doivent se croiser.**
Le vrai gain face à deux apps séparées : voir le volume d'entraînement et l'apport calorique sur le même graphique, et comprendre pourquoi le poids stagne.

## Comment on saura que ça marche

| Indicateur | Cible v1 |
|---|---|
| Temps pour enregistrer un aliment récent | < 5 s |
| Temps pour enregistrer une série pendant une séance | < 3 s |
| Rétention personnelle (l'auteur l'utilise) | 30 jours consécutifs |
| Fonctionnement complet en mode avion | 100 % des écrans hors recherche en ligne |
| Taille de l'APK | < 60 Mo |
| Démarrage à froid | < 2 s sur un milieu de gamme |

Le premier utilisateur, c'est toi. Si tu abandonnes l'app après trois semaines, c'est le produit qui a un problème, pas ta motivation.

## Ce qu'on ne fera pas

- Pas de réseau social, de fil d'actualité, de défis entre amis.
- Pas de plans d'entraînement générés automatiquement en v1 (c'est un produit à part entière).
- Pas de coaching nutritionnel ni de recommandation médicale.
- Pas de modèle économique en v1. Si monétisation il y a un jour, ce sera un achat unique ou un abonnement pour la sync, jamais de la publicité sur des données de santé.

## Horizon

- **v1 (Android)** — le sujet de cette documentation.
- **v2** — synchronisation multi-appareils chiffrée, iOS (la stack le permet sans réécriture), intégration Health Connect.
- **v3** — analyses croisées avancées, import depuis MyFitnessPal/Strong pour faciliter la bascule.
