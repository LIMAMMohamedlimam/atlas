# Périmètre de la v1

## Dans le périmètre

### Nutrition
- Journal quotidien à 4 créneaux : petit-déjeuner, déjeuner, dîner, collations.
- Recherche d'aliments : en ligne (Open Food Facts + USDA) et hors ligne (aliments déjà utilisés).
- Scan de code-barres via l'appareil photo.
- Création d'aliments personnels (saisie manuelle des valeurs nutritionnelles).
- Portions : grammes/millilitres, plus des portions nommées (« 1 tranche », « 1 bol »).
- Recettes multi-ingrédients avec calcul par portion.
- Repas enregistrés (« mon petit-déj habituel ») réutilisables en un tap.
- Objectifs caloriques et macros : calcul assisté (Mifflin-St Jeor) ou saisie manuelle.
- Suivi de l'eau bue.
- Copie d'un repas depuis un autre jour.

### Entraînement
- Bibliothèque d'exercices pré-remplie (~150 exercices) + exercices personnels.
- Programmes (routines) avec plusieurs séances types : Push / Pull / Legs, Full Body, etc.
- Séance en direct : cocher les séries, charge + répétitions, RPE optionnel.
- Chrono de repos automatique avec notification.
- Types de séries : échauffement, normale, dégressive, jusqu'à l'échec.
- Exercices au poids du corps, isométriques (durée) et cardio simple (durée + distance).
- Historique complet des séances, réutilisable comme point de départ.
- Détection automatique des records personnels.

### Progression
- Poids corporel et mensurations (tour de taille, bras, etc.).
- Graphiques : poids dans le temps, calories vs objectif, volume par groupe musculaire, 1RM estimé par exercice.
- Vue croisée nutrition × entraînement sur la même période.

### Transverse
- 100 % hors ligne, aucun compte utilisateur.
- Export complet des données (JSON + CSV) et réimport.
- Thème clair / sombre.
- Français et anglais.
- Unités métriques et impériales.

## Hors périmètre v1

Ces éléments sont volontairement écartés. Ils sont listés dans [le backlog](../plan/backlog.md).

| Écarté | Pourquoi |
|---|---|
| Synchronisation cloud, comptes | Ajoute auth, serveur, RGPD, gestion de conflits. Le schéma est préparé pour, mais on ne le construit pas maintenant. |
| iOS | Un seul OS à supporter pour la v1. La stack permettra le portage. |
| Health Connect / montres connectées | Dépendance native supplémentaire, à traiter proprement en v2. |
| Reconnaissance de repas par photo (IA) | Précision insuffisante pour être utile, et coût par requête. |
| Plans d'entraînement générés / progression automatique des charges | C'est un produit dans le produit. |
| Widgets, Wear OS | Confort, pas cœur de valeur. |
| Suivi du cardio par GPS | Cible utilisateur = musculation. |
| Micronutriments détaillés (vitamines, minéraux) | Le modèle de données les prévoit, l'UI v1 se limite aux macros + fibres, sucres, sel, graisses saturées. |
| Import depuis MyFitnessPal / Strong | Utile pour l'adoption, pas pour valider le produit. |

## Parcours utilisateurs clés

Ces cinq parcours sont les « chemins critiques ». Chacun doit rester rapide, même quand la base contient deux ans d'historique.

### P1 — Enregistrer un repas habituel
Ouvrir l'app → onglet Journal → tap sur « Déjeuner » → onglet « Fréquents » → tap sur l'aliment → la quantité par défaut est déjà celle utilisée la dernière fois → Valider.
**Objectif : 4 taps, moins de 5 secondes, sans réseau.**

### P2 — Scanner un produit inconnu
Journal → « Ajouter » → icône scan → caméra → code-barres reconnu → fiche produit affichée (depuis le réseau, ou depuis le cache local si déjà scanné) → choisir la portion → Valider.
**Cas d'échec à gérer : produit absent de la base → proposer de le créer manuellement, en pré-remplissant le code-barres.**

### P3 — Faire une séance
Onglet Entraînement → « Commencer » → choisir la séance du programme → l'app affiche les charges de la dernière fois → pour chaque série : ajuster si besoin, cocher → le chrono de repos démarre → série suivante → « Terminer la séance ».
**L'écran doit rester utilisable d'une seule main, avec les mains moites, en 30 secondes de repos.**

### P4 — Vérifier où j'en suis
Onglet Journal → l'anneau du haut montre calories consommées / objectif → les trois barres montrent protéines, glucides, lipides.
**Information disponible en 0 tap, dès l'ouverture de l'app.**

### P5 — Suivre ma progression
Onglet Progression → sélectionner « 3 mois » → voir la courbe de poids, la moyenne calorique hebdomadaire, et le volume total par semaine sur le même écran.

## Contraintes techniques de la v1

- Android 8.0 (API 26) minimum. `[À VÉRIFIER : aligner sur le minimum supporté par la version d'Expo retenue]`
- Fonctionnement complet sans permission réseau serait idéal, mais la recherche en ligne l'impose. La permission caméra est demandée **au moment du premier scan**, jamais au démarrage.
- Aucune permission de localisation, de contacts, ou de stockage étendu.
- Base de données cible : 50 000 entrées de journal et 5 000 séances sans dégradation perceptible.
