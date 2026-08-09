# Définition de « terminé »

« Ça marche chez moi » n'est pas un état d'achèvement. Cette liste l'est.

Elle vaut pour un humain comme pour un agent IA. Un agent qui annonce « c'est terminé » sans avoir parcouru cette liste n'a pas terminé.

## Pour une unité de travail (une PR)

### Fonctionnel
- [ ] Tous les critères d'acceptation concernés de la spec sont satisfaits.
- [ ] Les cas limites du tableau de la spec (§6) sont traités, ou explicitement reportés dans le backlog avec une justification.
- [ ] Les états vide, chargement et erreur sont gérés — pas seulement le cas nominal.
- [ ] Le comportement en **mode avion** est vérifié.

### Qualité de code
- [ ] `npm run typecheck` sans erreur.
- [ ] `npm run lint` sans erreur.
- [ ] Aucun `any` non justifié par un commentaire.
- [ ] Aucun `console.log` résiduel.
- [ ] Aucune chaîne de texte en dur dans l'interface.
- [ ] Aucune requête SQL hors de `src/data/`.
- [ ] Aucun fichier de plus de 400 lignes créé.

### Tests
- [ ] Toute nouvelle logique métier est couverte par des tests unitaires.
- [ ] Les cas limites sont testés, pas seulement le chemin heureux.
- [ ] `npm test` est vert.
- [ ] Les seuils de couverture de `src/domain/` sont respectés.
- [ ] Pour une correction de bug : **un test qui échouait avant la correction et qui passe après**.

### Données
- [ ] Toute modification de schéma est accompagnée d'une migration générée et testée.
- [ ] La migration a été testée sur une base de la version précédente contenant des données réalistes.
- [ ] `docs/architecture/data-model.md` est à jour dans la même PR.
- [ ] Aucune migration déjà livrée n'a été modifiée.

### Vérification réelle
- [ ] Testé sur un **appareil Android physique ou un émulateur**, pas seulement en test unitaire.
- [ ] Testé en thème clair **et** sombre.
- [ ] Testé avec un jeu de données réaliste (pas trois entrées : quelques centaines).
- [ ] Aucune régression visible sur les écrans adjacents.

### Accessibilité
- [ ] Cibles tactiles ≥ 48 dp.
- [ ] Aucune information portée par la seule couleur.
- [ ] Les éléments interactifs ont un libellé d'accessibilité.
- [ ] Testé avec une taille de police système augmentée.

### Documentation
- [ ] La spec est à jour si le comportement a changé pendant l'implémentation.
- [ ] Une décision structurante prise en cours de route est consignée en ADR.
- [ ] Le `CHANGELOG.md` est complété si l'utilisateur voit une différence.
- [ ] `CLAUDE.md` est mis à jour si une convention a évolué.

### Vie privée et sécurité
- [ ] Aucun nouvel appel réseau non documenté dans [security-privacy.md](../architecture/security-privacy.md).
- [ ] Aucune donnée personnelle dans les journaux.
- [ ] Aucune nouvelle permission Android sans justification écrite.
- [ ] Revue de sécurité effectuée si la PR touche au réseau, à l'export ou aux permissions.

## Pour un jalon complet

En plus de tout ce qui précède :

- [ ] Les 5 parcours E2E Maestro passent.
- [ ] Les budgets de performance de la [vision](../product/vision.md#comment-on-saura-que-ça-marche) sont mesurés, pas supposés.
- [ ] Testé sur un appareil bas de gamme, pas seulement sur le téléphone du développeur.
- [ ] Une session d'usage réel de plusieurs jours a été effectuée.
- [ ] La roadmap est mise à jour, le jalon suivant est cadré.
- [ ] Une version est étiquetée et un APK `preview` archivé.

## Ce qui n'est PAS requis

Pour éviter la paralysie sur un projet solo :

- Une couverture de tests de 100 %.
- Des tests de rendu visuel.
- Une documentation de chaque fonction.
- Une internationalisation parfaite avant M6 (le français suffit pendant le développement, tant que rien n'est en dur).
- Des optimisations de performance non justifiées par une mesure.

## La règle de la mauvaise foi

Si tu te dis « ça ira, je le ferai après », **écris-le dans le backlog avec une date**. Un raccourci consigné est une dette maîtrisée. Un raccourci oublié est un bug futur dont personne ne connaîtra l'origine.
