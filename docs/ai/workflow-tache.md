# Workflow d'une tâche

La boucle à suivre pour chaque unité de travail, que ce soit toi ou un agent qui l'exécute. Elle vaut aussi bien pour une fonctionnalité que pour une correction de bug.

```
   ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌────────┐
   │ EXPLORER │──►│ PLANIFIER│──►│ IMPLÉMENTER  │──►│ VÉRIFIER │──►│ FINIR  │
   └──────────┘   └──────────┘   └──────┬───────┘   └────┬─────┘   └────────┘
                                        │                │
                                        └────────────────┘
                                          boucle courte
```

L'erreur la plus fréquente est de sauter directement à « implémenter ». Le code arrive plus vite, et il est faux plus longtemps.

---

## 1. Explorer — comprendre avant de toucher

**Objectif : savoir ce qui existe déjà.**

- Lire la spec concernée dans `docs/specs/`.
- Vérifier les ADR liés : la décision est peut-être déjà prise.
- Lire le code existant du module, y compris ses tests — ils révèlent les intentions.
- Repérer les patterns déjà en place : un nouveau code doit ressembler à ce qui l'entoure.

**Sortie attendue :** être capable de dire en trois phrases ce qu'on va modifier et pourquoi.

**Signal d'alarme :** si la spec n'existe pas ou reste ambiguë, **on s'arrête et on l'écrit**. Coder à partir d'hypothèses non écrites, c'est garantir une reprise.

---

## 2. Planifier — écrire avant de coder

**Objectif : un plan revu avant qu'une ligne ne soit écrite.**

Le plan contient :
1. les fichiers créés ou modifiés ;
2. les décisions techniques et leurs alternatives écartées ;
3. les tests prévus, rattachés aux critères `CA-x` ;
4. les risques et les cas limites ;
5. ce qui reste hors périmètre.

Pour une tâche non triviale, le mode plan d'un agent est fait pour ça : il explore et propose sans rien modifier.

**Règle : plus la tâche est risquée, plus le plan est détaillé.** Une migration de base mérite un plan écrit. Renommer une variable, non.

**Point de validation humaine.** C'est ici qu'on rattrape un malentendu à moindre coût. Un plan corrigé coûte deux minutes ; une implémentation corrigée coûte une heure.

---

## 3. Implémenter — par petits incréments vérifiables

**Objectif : du code qui fonctionne, dans le style du projet.**

Ordre recommandé :

1. **Le schéma et la migration**, s'il y en a — c'est le plus contraignant.
2. **Le domaine pur** avec ses tests. Rapide, sans émulateur, et c'est là qu'est le risque réel.
3. **Le repository** et ses tests d'intégration.
4. **Les hooks**.
5. **L'interface** en dernier — c'est la partie la plus facile à corriger.

Ce sens (des données vers l'écran) évite de découvrir en fin de parcours que le modèle ne permet pas ce que l'écran demande.

Pendant l'implémentation :
- lancer les tests fréquemment, pas seulement à la fin ;
- rester dans le périmètre du plan ; toute idée nouvelle va dans le backlog ;
- suivre les [conventions](../engineering/conventions-code.md) sans les redécouvrir.

**Cas particulier — corriger un bug :**
1. Écrire un test qui **reproduit** le bug.
2. Vérifier qu'il **échoue**.
3. Corriger.
4. Vérifier qu'il passe.

Sans l'étape 2, on ne sait pas si le test teste quoi que ce soit.

---

## 4. Vérifier — se prouver que ça marche

**Objectif : ne pas confondre « ça compile » et « ça fonctionne ».**

Dans l'ordre :

```bash
npm run typecheck
npm run lint
npm test
```

Puis, ce que les tests ne voient pas :

- lancer l'app sur un appareil ou un émulateur et **utiliser réellement** la fonctionnalité ;
- la tester **en mode avion** ;
- la tester avec un jeu de données réaliste, pas trois lignes ;
- la tester en thème sombre ;
- reprendre le tableau des cas limites de la spec (§6) et les essayer un par un.

**Un agent ne doit jamais déclarer une tâche terminée sur la seule foi de tests unitaires verts.** S'il ne peut pas vérifier sur un appareil, il le dit explicitement.

---

## 5. Finir — laisser le dépôt propre

- Parcourir [definition-of-done.md](../engineering/definition-of-done.md), réellement, pas en diagonale.
- Mettre à jour la spec si le comportement a changé pendant l'implémentation.
- Écrire un ADR si une décision structurante a été prise en route.
- Commit au format conventionnel, avec la référence `SPEC-XXX RG-y`.
- Ouvrir la PR avec le modèle de description.
- Lancer une revue automatisée (`/code-review`) avant de fusionner.

---

## Trois règles qui font la différence

### Rendre compte fidèlement

Si un test échoue, on le dit avec sa sortie. Si une étape a été sautée, on le dit. Si quelque chose n'a pas pu être vérifié, on le dit.

Un agent qui annonce « tout fonctionne » alors que deux tests échouent fait plus de dégâts qu'un agent qui n'a rien fait, parce qu'on lui fait confiance.

### S'arrêter quand on ne sait pas

Face à une ambiguïté :
1. faire d'abord tout ce qui n'en dépend pas ;
2. formuler l'hypothèse retenue **explicitement** et continuer, ou poser la question si se tromper rendrait le travail inutile.

Ce qu'il ne faut pas faire : deviner en silence, ou tout bloquer pour un détail.

### Ne pas élargir

L'app doit rester finissable. Toute bonne idée qui n'est pas dans la spec va dans [le backlog](../plan/backlog.md). Le nombre de projets personnels morts d'élargissement continu est très supérieur au nombre de projets morts d'un périmètre trop étroit.

---

## Le workflow condensé

```
1. Lire la spec + les ADR concernés
2. Écrire un plan → le faire valider
3. Schéma → domaine → repository → hooks → UI, avec tests à chaque étape
4. typecheck + lint + test + essai réel sur appareil + mode avion
5. Definition of done → commit → PR → revue → fusion
```
