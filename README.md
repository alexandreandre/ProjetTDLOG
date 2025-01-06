# ProjetTDLOG
4 Novembre:
Création du fichier user.py:
Création du fichier main.py  
Création du fichier elevator_controller.py:

25 Novembre :
Création de elevator_guy.py qui gère l'interface graphique de l'ascenseur

2 décembre : 
Idée finale : Jeu ou on va chercher des gens avec un ou plusieurs ascenseurs. Le niveau de difficultés (nombre de personnes, nombre d'ascenseurs, etc...)

9 décembre : 
On a créé un nouveau dossier avec une nouvelle architecture :
ProjetTDLOG/
├── app.py               --> Point d'entrée de l'application Flask
├── requirements.txt     --> Liste des dépendances Python
├── static/              --> Contient les fichiers statiques (CSS, JS)
│   ├── css/
│   │   └── styles.css    --> Feuille de style pour le jeu
│   ├── js/
│       └── game.js       --> Script JavaScript pour la logique du jeu
│ 
├── templates/           --> Contient les fichiers HTML
        └── index.html        --> Page principale du jeu
Changements durant la séance : 
- On devait cliquer sur l'ascenseur souhaité à chaque fois qu'on voulait le déplacer --> Maintenant, on doit cliquer sur la colonne de l'ascenseur à l'étage qu'on souhaite directement
- Ajout de floor aux paramètres de chaque niveau
- Ajout du choix du mode de jeu (de 1 à 5 ascenseurs)
- Ajout du choix de la couleur de l'elevator à l'arrêt, en mouvement, et des personnages, selon le niveau

A faire pour la prochaine fois :
- 5 niveaux cohérent
- Modes de jeu
    ├── Solo     
            ├── Niveaux
            ├── Contre la montre (Max de personnes en 1 min)
            ├── Satisfaction (style cooking fever)
    ├── En ligne     
            ├── 1v1 Niveaux
            ├── 1v1 Contre la montre
            ├── 1v1 Satisfaction (style cooking fever)
    ├── Contre l'IA
            ├── 1v1 Niveaux
            ├── 1v1 Contre la montre 
            ├── 1v1 Satisfaction (style cooking fever)
    
6 Janvier  

Organisation  
Création des fichiers :  
- **`app.py`** : Point d'entrée de l'application Flask pour gérer les routes et afficher le jeu.  
- **`index.html`** : Structure principale du jeu avec l'affichage dynamique de l'interface utilisateur.  
- **`game.js`** : Contient toute la logique du jeu (ascenseurs, personnages, niveaux, dessin sur le canvas).  
- **`styles.css`** : Gère l'apparence et le style de l'interface utilisateur (jeu et menu).  


Ajouts fonctionnels majeurs :   

1. **Affichage du score à atteindre**  
   - Nouvel élément `scoreToPass` ajouté à l'interface utilisateur, indiquant le score nécessaire pour compléter le niveau actuel.  
   - Design harmonisé avec les autres informations d'en-tête (niveau, timer, score).  

2. **Gestion unifiée des cercles (passagers et personnages)**  
   - Rayon unique basé sur `RADIUS_FACTOR` pour assurer une cohérence entre les cercles.  
   - Contours proportionnels au rayon pour un rendu visuel équilibré.  

3. **Amélioration de la mise à jour de l'interface (`updateUI`)**  
   - Mise à jour automatique du `scoreToPass` lors des transitions de niveaux.  

4. **Affichage dynamique des étages**  
   - La hauteur et la position des étages s'ajustent en fonction du nombre d'étages dans le niveau.  

5. **Tailles dynamiques des textes sur le canvas**  
   - Les polices utilisées pour les numéros d'étages et les destinations des passagers s'ajustent automatiquement pour garantir lisibilité et esthétique.  


Améliorations esthétiques  
1. **Dégradés pour les ascenseurs**  
   - Couleurs harmonisées avec des dégradés dynamiques selon l'état des ascenseurs (en mouvement ou à l'arrêt).  

2. **Modernisation des styles CSS**  
   - Utilisation d'ombres, bordures et transitions fluides pour une meilleure expérience utilisateur.  

3. **Harmonisation de l'affichage UI**  
   - Uniformité des styles pour les éléments `score`, `level`, `timer`, et `scoreToPass` avec la même police, couleur et taille.  


Prochaines étapes possibles  
1. **Ajout de nouveaux modes de jeu**  
   - Contre-la-montre (maximiser les passagers transportés en 1 minute).  
   - Satisfaction des passagers (notation basée sur le temps d’attente).  

2. **Création de niveaux avancés**  
   - Progression solo avec des difficultés croissantes (spawn de personnages plus rapide, gestion multiple d'ascenseurs).  
   - Modes compétitifs (1v1 en ligne ou contre l'IA).  

3. **Amélioration de l’expérience visuelle**  
   - Ajout d’animations pour les passagers montant ou descendant des ascenseurs.  
   - Intégration d’effets sonores pour enrichir l’interactivité (clics, mouvements).  

4. **Optimisation du code**  
   - Séparation en modules pour la gestion des ascenseurs et des personnages.  
   - Chargement dynamique des niveaux depuis un fichier JSON externe.  

---
Améliorations pour la prochaine fois : 
- Le passager monte dans l'ascenseur meme si il arrive alors que l'ascenseur y est déjà
- La file des passagers se superpose dans l'autre sens
- Design un peu
- NOUVEAUX MODES : 
        - Match contre l'IA (soit chacun a ses passagers, soit on a les memes et le premier qui le récupère l'a)
        - Match 1v1 en ligne (idem)
