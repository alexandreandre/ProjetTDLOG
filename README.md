# Elevator Race

**Elevator Race** est un jeu interactif de gestion d’ascenseurs où le joueur doit transporter des passagers en temps limité pour atteindre un score cible. Développé avec une interface graphique basée sur HTML5 (canvas), CSS et JavaScript, et servi via une application Flask, le jeu propose plusieurs modes (Solo, 1 vs 1 contre l’IA) et s’adapte aussi bien aux ordinateurs qu’aux téléphones.

---

## Table des Matières

- [Historique & Évolutions](#historique--évolutions)
- [Fonctionnalités Implémentées](#fonctionnalités-implémentées)
- [Architecture du Projet](#architecture-du-projet)
- [Perspectives d’Amélioration](#perspectives-damélioration)

---

## Historique & Évolutions

- **4 Novembre**  
  - Création des fichiers de base : `user.py`, `main.py`, `elevator_controller.py`.

- **25 Novembre**  
  - Ajout de `elevator_guy.py` pour la gestion de l’interface graphique de l’ascenseur.

- **2 Décembre**  
  - Définition de l’idée finale : un jeu où l’on dirige un ou plusieurs ascenseurs pour récupérer des passagers, avec une difficulté variable (nombre de personnes, nombre d’ascenseurs, etc.).

- **9 Décembre**  
  - Réorganisation de l’architecture du projet avec la mise en place d’une application Flask et la séparation des ressources dans des dossiers **`static/`** et **`templates/`**.  
  - Changements notables :
    - Passage d’une commande « cliquer sur l’ascenseur à déplacer » à « cliquer sur la colonne de l’ascenseur à l’étage désiré ».
    - Ajout du paramètre `floor` dans la configuration des niveaux.
    - Possibilité de choisir le nombre d’ascenseurs (de 1 à 5) et de définir des couleurs personnalisées pour l’ascenseur (à l’arrêt et en mouvement) ainsi que pour les personnages.

- **6 Janvier**  
  - Organisation et clarification du code :
    - **`app.py`** gère les routes et sert l’interface.
    - **`index.html`** constitue la page principale avec l’interface utilisateur et divers overlays (confirmation, mode de jeu, réglages).
    - **`game.js`** regroupe toute la logique du jeu (gestion des ascenseurs, passagers, niveaux, animations sur canvas).
    - **`styles.css`** s’occupe de l’apparence et des thèmes (default, retro, night).

- **13-20 Janvier**  
  - Ajout de fonctionnalités telles que :
    - Boutons de réglages, mode de jeu, bouton Home.
    - Intégration d’une IA avec réglage de difficulté.
    - Ajout de musiques de fond et de sons (victoire, défaite).

- **Après la soutenance**  
  - Amélioration de la lisibilité du code avec des commentaires Doxygen.
  - Adaptation de l’interface pour une version mobile.
  - Mise en ligne du jeu via une page web permettant d’y jouer sans lancer manuellement l’application.

---

## Fonctionnalités Implémentées

- **Interface Graphique Interactive**  
  - Utilisation du canvas HTML5 pour afficher dynamiquement le bâtiment, les ascenseurs et les passagers.
  - Dessin dynamique des étages, taille des textes et animations (dégradés, transitions, effets « glitch » et « shake »).

- **Modes de Jeu**  
  - **Solo** : Transport des passagers en respectant un score cible.
  - **1 vs 1 contre l’IA** : Le joueur affronte une IA qui gère également un ascenseur (comparaison des scores en fin de niveau).

- **Interface Utilisateur et Overlays**  
  - Mise à jour en temps réel du score, du niveau, du timer et du score à atteindre.
  - Overlays pour la confirmation de l’arrêt de partie, la sélection du mode de jeu et les réglages (thème, nombre d’ascenseurs, difficulté de l’IA).

- **Effets Sonores et Musique**  
  - Plusieurs fichiers audio (musique de fond) pour enrichir l’expérience utilisateur.

- **Adaptation Mobile**  
  - Responsive design et ajustements dans le CSS pour une bonne lisibilité sur téléphone.

---

## Architecture du Projet

La structure actuelle du projet est la suivante :

/
├── __pycache__/
│   └── app.cpython-310.pyc
├── static/
│   ├── audio/
│   │   ├── jazz.mp3
│   │   ├── Logobi mptres.mp3
│   │   ├── lost.mp3
│   │   ├── lost2.mp3
│   │   └── win.mp3
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── game.js
├── templates/
│   └── index.html
├── app.py
├── Procfile
├── README.md
├── requirements.txt
├── runtime.txt
└── sitemap.xml

Les autres fichiers (Procfile, runtime.txt, sitemap.xml) servent à la configuration et au déploiement (par exemple, sur Heroku).



## Perspectives d’Amélioration

Même si de nombreuses fonctionnalités sont déjà implémentées, voici quelques axes envisagés pour les prochaines évolutions :

- **Nouveaux Modes de Jeu**
  - Implémenter des modes contre-la-montre et de satisfaction (notation basée sur le temps d’attente) pour le mode Solo.
  - Développer des versions 1 vs 1 en ligne pour offrir des parties compétitives en temps réel.

- **Optimisation du Code**
  - Modulariser davantage la logique du jeu en séparant la gestion des ascenseurs et des passagers dans différents modules.
  - Charger dynamiquement les niveaux via des fichiers JSON externes afin de faciliter la création et la modification des niveaux.

- **Amélioration Visuelle et Sonore**
  - Ajouter des animations supplémentaires pour les déplacements des passagers et des ascenseurs, afin de rendre l’expérience plus fluide et immersive.
  - Intégrer des effets sonores complémentaires (clics, mouvements d’ascenseurs, sons de défaite, etc.) pour enrichir l’expérience utilisateur.

- **Expérience Utilisateur**
  - Optimiser les interactions en gérant les cas particuliers (par exemple, empêcher qu’un passager embarque si l’ascenseur est déjà présent).
  - Améliorer l’adaptation de l’interface pour les écrans tactiles et mobiles, avec une responsivité et une ergonomie renforcées.









