# src/features — composants et hooks métier

Un dossier par domaine fonctionnel (`diary/`, `food-search/`, `workout-session/`, `progress/`),
contenant ses composants, ses hooks et ses tests.

Distinction avec `src/ui` : ici on connaît le métier (une entrée de journal, une série).
Dans `src/ui`, on ne connaît que des boutons et des cartes.

Un composant appelle un hook, affiche le résultat, remonte les événements.
S'il calcule des macros, c'est un bug de conception : ça appartient à `src/domain`.
