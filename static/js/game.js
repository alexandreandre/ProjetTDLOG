/**
 * \file game.js
 * \brief Script principal du jeu de gestion d’ascenseurs.
 *
 * Regroupe :
 *   - Les définitions des classes Elevator et Character
 *   - La logique de progression (score, niveau, timer)
 *   - L’initialisation du jeu (initGame) et la boucle principale (gameLoop)
 */

// Vérification de l'exécution du script
console.log("game.js chargé correctement.");

//! \brief Récupère le canvas et son contexte 2D pour dessiner le jeu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// =================== VARIABLES GLOBALES ===================
/** \var score Score du joueur (mode solo) */
let score = 0;
/** \var scoreAI Score de l’IA (en mode 1 vs 1 IA) */
let scoreAI = 0; 
let level = 1;           //!< Niveau en cours
let timer = 25;          //!< Timer de 25s
let timerInterval;       //!< Référence à l’interval du timer
let spawnInterval;       //!< Référence à l’interval de création des passagers
let gameRunning = false; //!< Indique si un niveau est en cours
let selectedElevator = null;      //!< Elevator actuellement sélectionné
let selectedElevatorCount = 1;    //!< Nombre d’ascenseurs choisis

// -- Mode IA
let isAIMode = false;     //!< True si on joue en 1 vs 1 IA
let aiDecisionDelay = 1000;  //!< Délai (ms) entre les décisions de l’IA

const elevators = [];   //!< Tableau d’ascenseurs
const characters = [];  //!< Tableau de passagers

// =================== CONFIGURATIONS DE NIVEAU ===================
/**
 * \brief Configuration par niveau et par “set” (ex: 1 ascenseur, 2 ascenseurs, etc.).
 *  - floors : nombre d’étages
 *  - spawnSpeed : interval de génération de passagers
 *  - elevatorSpeed : vitesse de déplacement de l’ascenseur
 *  - scoreToPass : score requis pour réussir
 *  - capacity : capacité de l’ascenseur
 */
const levelConfig = {
  1: {
    1: { spawnSpeed: 1300, elevatorSpeed: 200, scoreToPass: 70, capacity: 1, floors: 5 },
    2: { spawnSpeed: 2000, elevatorSpeed: 150, scoreToPass: 100, capacity: 1, floors: 8 },
    3: { spawnSpeed: 1400, elevatorSpeed: 50, scoreToPass: 140, capacity: 1, floors: 10 },
    4: { spawnSpeed: 1300, elevatorSpeed: 10, scoreToPass: 160, capacity: 1, floors: 10 },
  },
  2: {
    1: { spawnSpeed: 1700, elevatorSpeed: 500, scoreToPass: 50, capacity: 1, floors: 5 },
    2: { spawnSpeed: 1700, elevatorSpeed: 400, scoreToPass: 90, capacity: 1, floors: 8 },
    3: { spawnSpeed: 2000, elevatorSpeed: 300, scoreToPass: 110, capacity: 1, floors: 10 },
  },
  3: {
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10 },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10 },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10 },
  },
  4: {
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10 },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10 },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10 },
  },
  5: {
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10 },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10 },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10 },
  }
};

// =================== UTILITAIRE DESSIN RECTANGLE ARRONDI ===================
/**
 * \brief Dessine un rectangle arrondi
 * \param ctx Contexte 2D
 * \param x Position X
 * \param y Position Y
 * \param width Largeur
 * \param height Hauteur
 * \param radius Rayon d’arrondi
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// =================== CLASSE ASCENSEUR ===================
/**
 * \class Elevator
 * \brief Représente un ascenseur (manuelle ou IA).
 *
 * - \c capacity : nombre de passagers max
 * - \c currentFloor : étage actuel
 * - \c isAI : booléen indiquant si ascenseur IA
 */
class Elevator {
  /**
   * \param id Index de l’ascenseur
   * \param capacity Capacité
   * \param isAI Indique si l’ascenseur est contrôlé par l’IA
   */
  constructor(id, capacity, isAI = false) {
    this.id = id;
    this.capacity = capacity; 
    this.currentFloor = 0;
    this.destinationFloor = null;
    this.passengers = [];
    this.moving = false;
    this.isAI = isAI;
    this.nextDecisionTime = 0;
    console.log(`Ascenseur ${this.id + 1} initialisé (isAI=${isAI}) avec une capacité de ${this.capacity}`);
  }

  /**
   * \brief Méthode appelée chaque frame si c’est un ascenseur IA
   *  - Si l’ascenseur n’est pas en mouvement, on charge les passagers
   *  - On exécute la logique auto (autoMove)
   */
  update() {
    if (!this.moving) {
      this.loadPassengersOnCurrentFloor();
    }
    if (this.isAI) {
      this.autoMove();
    }
  }

  /**
   * \brief Charge tous les passagers sur l’étage courant (si ascenseur à l’arrêt)
   */
  loadPassengersOnCurrentFloor() {
    for (let i = 0; i < characters.length; i++) {
      const c = characters[i];
      if (c.currentFloor === this.currentFloor && this.passengers.length < this.capacity) {
        const loaded = this.loadPassenger(c, true);
        if (loaded) {
          characters.splice(i, 1);
          i--;
        }
      }
    }
  }

  /**
   * \brief Logique IA :
   *  - Si j’ai des passagers, je vais à leur destination
   *  - Sinon, je cherche le passager le plus proche
   *  - Respecte un délai aiDecisionDelay
   */
  autoMove() {
    if (this.moving) return;
    if (Date.now() < this.nextDecisionTime) return;

    // 1) Si j’ai des passagers
    if (this.passengers.length > 0) {
      const nextDest = this.passengers[0].destinationFloor;
      this.moveToFloor(nextDest);
      this.nextDecisionTime = Date.now() + aiDecisionDelay;
      return;
    }

    // 2) Sinon, trouver le passager le plus proche
    if (characters.length > 0) {
      const closestPassenger = characters.reduce((closest, passenger) => {
        if (!closest) return passenger;
        const distCurrent = Math.abs(passenger.currentFloor - this.currentFloor);
        const distClosest = Math.abs(closest.currentFloor - this.currentFloor);
        return distCurrent < distClosest ? passenger : closest;
      }, null);

      if (closestPassenger) {
        this.moveToFloor(closestPassenger.currentFloor);
        this.nextDecisionTime = Date.now() + aiDecisionDelay;
      }
    }
  }

  /**
   * \brief Déplace l’ascenseur vers l’étage \p floor
   */
  moveToFloor(floor) {
    const config = levelConfig[selectedElevatorCount][level];
    if (this.moving) {
      console.log(`Ascenseur ${this.id + 1} est déjà en mouvement.`);
      return;
    }
    if (floor === this.currentFloor) {
      console.log(`Ascenseur ${this.id + 1} est déjà à l'étage ${floor}.`);
      return;
    }
    this.moving = true;
    this.destinationFloor = floor;
    console.log(`Ascenseur ${this.id + 1} déplacé de l'étage ${this.currentFloor} à l'étage ${floor}`);

    const direction = floor > this.currentFloor ? 1 : -1;
    const moveInterval = setInterval(() => {
      if (this.currentFloor + direction < 0 ||
          this.currentFloor + direction >= config.floors) {
        clearInterval(moveInterval);
        this.moving = false;
        console.log(`Ascenseur ${this.id + 1} a atteint la limite des étages.`);
        return;
      }

      this.currentFloor += direction;

      if (this.currentFloor === floor) {
        clearInterval(moveInterval);
        this.moving = false;
        this.unloadPassengers();
        this.loadPassengers();
      }
      drawBuilding();
    }, config.elevatorSpeed);
  }

  /**
   * \brief Tente de charger un passager \p passenger
   * \return true si embarqué, false sinon
   */
  loadPassenger(passenger) {
    if (this.passengers.length < this.capacity) {
      this.passengers.push(passenger);
      console.log(`Passager embarqué dans ascenseur ${this.id + 1} => destination ${passenger.destinationFloor}`);
      return true;
    }
    console.log(`Ascenseur ${this.id + 1} plein. Passager ne peut pas embarquer.`);
    return false;
  }

  /**
   * \brief Décharge les passagers qui ont atteint leur destination
   *  - Incrémente le score (scoreAI si ascenseur IA)
   */
  unloadPassengers() {
    const initialCount = this.passengers.length;
    this.passengers = this.passengers.filter((p) => {
      if (p.destinationFloor === this.currentFloor) {
        if (this.isAI) {
          scoreAI += 10;
        } else {
          score += 10;
        }
        return false;
      }
      return true;
    });
    const unloaded = initialCount - this.passengers.length;
    if (unloaded > 0) {
      updateScore();
    }
  }

  /**
   * \brief Charge instantanément les passagers (depuis le tableau characters)
   *        présents à l’étage courant
   */
  loadPassengers() {
    for (let i = 0; i < characters.length; i++) {
      let character = characters[i];
      if (character.currentFloor === this.currentFloor) {
        if (this.loadPassenger(character)) {
          characters.splice(i, 1);
          i--;
        }
      }
    }
  }

  /**
   * \brief Dessine l’ascenseur dans le canvas (position, passagers, etc.)
   */
  draw() {
    const config = levelConfig[selectedElevatorCount][level];
    const floorHeight = canvas.height / config.floors;

    const elevatorHeight = floorHeight; 
    const x = 200 + this.id * 180;
    const baseWidth = 80;
    const widthPerCapacity = 20;
    const elevatorWidth = baseWidth + (widthPerCapacity * this.capacity);

    const y = canvas.height - (this.currentFloor * floorHeight) - elevatorHeight;

    // Dégradé vertical (couleur diff. si en mouvement)
    const grad = ctx.createLinearGradient(x, y, x, y + elevatorHeight);
    if (this.moving) {
      grad.addColorStop(0, "#f5a9f2");
      grad.addColorStop(1, "#d381c3");
    } else {
      grad.addColorStop(0, "#70f4ff");
      grad.addColorStop(1, "#2cb3bd");
    }
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.min(8, Math.max(2, floorHeight * 0.03)) + 1;
    roundRect(ctx, x, y, elevatorWidth, elevatorHeight, 10);

    // Dessin des passagers (cercles + destination)
    const spacing = elevatorWidth / (this.capacity + 1);
    const passengerRadius = 2 * floorHeight ** (1/2);

    for (let i = 0; i < this.capacity; i++) {
      const passengerX = x + spacing * (i + 1);
      const passengerY = y + elevatorHeight / 2;

      if (i < this.passengers.length) {
        ctx.beginPath();
        ctx.arc(passengerX, passengerY, passengerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff00d4";
        ctx.fill();

        const dynamicStroke = Math.min(8, Math.max(2, passengerRadius * 0.2)) + 1;
        ctx.lineWidth = dynamicStroke;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = `bold ${passengerRadius * 1.2}px Arial`;
        ctx.fillText(
          `${this.passengers[i].destinationFloor}`,
          passengerX,
          passengerY + (passengerRadius * 0.4)
        );
      } else {
        ctx.beginPath();
        ctx.arc(passengerX, passengerY, passengerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#fff";
        ctx.stroke();
      }
    }

    // Surligner l'ascenseur sélectionné
    if (selectedElevator === this) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, elevatorWidth, elevatorHeight);
    }
  }
}

// =================== CLASSE CHARACTER ===================
/**
 * \class Character
 * \brief Représente un passager
 *
 * - \c currentFloor : étage actuel
 * - \c destinationFloor : étage où il veut aller
 */
class Character {
  constructor() {
    const config = levelConfig[selectedElevatorCount][level];
    this.currentFloor = Math.floor(Math.random() * config.floors);
    this.destinationFloor = this.getRandomDestinationFloor(this.currentFloor, config.floors);
    console.log(`Nouveau passager à l'étage ${this.currentFloor} voulant aller à l'étage ${this.destinationFloor}`);
  }

  /**
   * \brief Tire un étage au hasard (différent de \p excludeFloor)
   */
  getRandomDestinationFloor(excludeFloor, totalFloors) {
    let floor;
    do {
      floor = Math.floor(Math.random() * totalFloors);
    } while (floor === excludeFloor);
    return floor;
  }

  /**
   * \brief Retourne tous les passagers à l’étage \p floor
   */
  static getCharactersOnFloor(floor) {
    return characters.filter(character => character.currentFloor === floor);
  }

  /**
   * \brief Dessine le passager (un cercle rose + numéro d’étage)
   */
  draw() {
    const config = levelConfig[selectedElevatorCount][level];
    const floorHeight = canvas.height / config.floors;
    const charactersOnSameFloor = Character.getCharactersOnFloor(this.currentFloor);
    const localIndex = charactersOnSameFloor.indexOf(this);

    const characterRadius = 2 * floorHeight ** (1/2);
    const baseX = 80;
    const offsetX = characterRadius + 10;
    const x = baseX - localIndex * offsetX;
    const y = canvas.height - (this.currentFloor + 0.5) * floorHeight;

    ctx.beginPath();
    ctx.arc(x, y, characterRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff00d4";
    ctx.fill();

    const dynamicStroke = Math.min(8, Math.max(2, characterRadius * 0.2)+1);
    ctx.lineWidth = dynamicStroke;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `bold ${characterRadius * 1.4}px Arial`;
    ctx.fillText(this.destinationFloor, x, y + (characterRadius * 0.4) + 1);
  }
}

// =================== DEMARRAGE DE NIVEAU ===================
/**
 * \brief Lance le niveau (reset, dessine, timer…)
 */
function startLevel() {
  if (gameRunning) {
    console.log("Le jeu est déjà en cours.");
    return;
  }
  console.log("Démarrage du niveau...");
  gameRunning = true;

  const config = levelConfig[selectedElevatorCount][level];
  resetGame(config);
  setupElevators();

  document.getElementById("startButton").disabled = true;
  startTimer();
  console.log(`Niveau ${level} démarré avec ${selectedElevatorCount} ascenseur(s).`);
}

/**
 * \brief Réinitialise les variables pour le niveau en cours
 *  - Vide le tableau d’ascenseurs / passagers
 *  - Crée les ascenseurs (mode solo ou IA)
 *  - Lance le spawnInterval
 */
function resetGame(config) {
  score = 0;
  scoreAI = 0;
  characters.length = 0;
  elevators.length = 0;
  selectedElevator = null;

  if (isAIMode) {
    // Joueur
    for (let i = 0; i < selectedElevatorCount; i++) {
      elevators.push(new Elevator(i, config.capacity, false));
    }
    // IA
    for (let i = 0; i < selectedElevatorCount; i++) {
      const eAI = new Elevator(selectedElevatorCount + i, config.capacity, true);
      eAI.nextDecisionTime = Date.now() + aiDecisionDelay;
      elevators.push(eAI);
    }
  } else {
    // Mode solo
    for (let i = 0; i < selectedElevatorCount; i++) {
      elevators.push(new Elevator(i, config.capacity, false));
    }
  }

  console.log(`${elevators.length} ascenseur(s) initialisé(s).`);

  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnCharacter, config.spawnSpeed);
  updateUI();
}

/**
 * \brief Met à jour l’affichage du score (selon mode IA ou solo)
 */
function updateScore() {
  const scoreLine = document.getElementById('score-line');
  if (!scoreLine) {
    console.error("L'élément #score-line est introuvable.");
    return;
  }

  if (isAIMode) {
    // Mode IA : on affiche “score-user” - “scoreIA”
    scoreLine.classList.remove('solo-mode');
    scoreLine.innerHTML = `<span id="user-score" style="color: green;">${score}</span>-<span id="ia-score" style="color: red;">${scoreAI}</span>`;
  } else {
    // Mode solo : juste Score : <valeur>
    scoreLine.classList.add('solo-mode');
    scoreLine.innerHTML = `
      Score : <span id="user-score" style="color: green;">${score}</span>
    `;
  }
}

/** \brief Met à jour l’affichage du niveau */
function updateLevel() {
  document.getElementById('level').innerText = `Niveau: ${level}`;
}

/** \brief Met à jour l’interface (score, niveau, scoreToPass) */
function updateUI() {
  updateScore();
  updateLevel();

  const config = levelConfig[selectedElevatorCount][level];
  document.getElementById('scoreToPass').innerText = `À atteindre : ${config.scoreToPass}`;
}

// =================== TIMER ===================
/**
 * \brief Lance le timer de 25 secondes, met à jour l’affichage chaque seconde
 */
function startTimer() {
  timer = 25;
  document.getElementById("timer").innerText = `Temps restant : ${timer}s`;

  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = `Temps restant : ${timer}s`;

    if (timer <= 0) {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      checkLevelCompletion();
    }
  }, 1000);
}



/**
 * \brief Vérifie la fin de niveau (score atteint ou non).
 *  - Mode IA : compare score / scoreAI
 *  - Mode solo : compare score / scoreToPass
 */
function checkLevelCompletion() {
  gameRunning = false;
  document.getElementById("startButton").disabled = false;

  const config = levelConfig[selectedElevatorCount][level];
  if (isAIMode) {
    if (score >= config.scoreToPass && score > scoreAI) {
      victoryOverlay(`Vous avez battu l'IA avec ${score} contre ${scoreAI}! Niveau terminé !`);
      level++;
    } else {
      failOverlay(`L'IA vous a battu (${scoreAI} contre ${score}), ou vous n'avez pas le score requis (${score}/${config.scoreToPass}).`);
    }
  } else {
    // Mode solo
    if (score >= config.scoreToPass) {
      victoryOverlay(`Niveau ${level} terminé ! Vous passez au niveau ${level + 1}.`);
      level++;
    } else {
      failOverlay(`Niveau ${level} échoué. Essayez à nouveau !`);
    }
  }

  if (level > Object.keys(levelConfig[selectedElevatorCount]).length) {
    alert("Félicitations ! Vous avez terminé tous les niveaux !");
    level = 1;
  }
}

/**
 * \brief Affiche l’overlay de victoire avec \p message
 */
function victoryOverlay(message) {
  const levelUpText = document.getElementById("level-up-text");
  levelUpText.innerText = message;

  const levelUpOverlay = document.getElementById("level-up-overlay");
  levelUpOverlay.style.display = "flex";

  setTimeout(() => {
    levelUpOverlay.style.display = "none";
  }, 3000);
}

/**
 * \brief Affiche l’overlay de défaite avec \p message
 */
function failOverlay(message) {
  const failText = document.getElementById("level-fail-text");
  failText.innerText = message;

  const failOverlay = document.getElementById("level-fail-overlay");
  failOverlay.style.display = "flex";

  setTimeout(() => {
    failOverlay.style.display = "none";
  }, 3000);
}

// =================== SPAWN DE PASSAGERS ===================
/**
 * \brief Crée un nouveau Character et l’ajoute à la liste \c characters
 */
function spawnCharacter() {
  const character = new Character();
  characters.push(character);
  console.log(`Passager ajouté. Total passagers en attente : ${characters.length}`);
}

// =================== DESSIN DU BUILDING ===================
/**
 * \brief Dessine tout le bâtiment (étages, ascenseurs, passagers)
 */
function drawBuilding() {
  const config = levelConfig[selectedElevatorCount][level];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const floorHeight = canvas.height / config.floors;
  const labelFontSize = Math.min(32, Math.max(8, floorHeight * 0.3));
  ctx.font = `bold ${labelFontSize}px "Press Start 2P"`;
  ctx.textAlign = 'right';
  ctx.strokeStyle = "#888"; 
  ctx.lineWidth = 1;
  
  // Tracer les étages
  for (let i = 0; i < config.floors; i++) {
    const y = i * floorHeight;
    const canvasY = canvas.height - y;

    ctx.beginPath();
    ctx.moveTo(0, canvasY);
    ctx.lineTo(canvas.width, canvasY);
    ctx.stroke();

    ctx.fillStyle = "#00ffea";
    ctx.fillText(`${i}`, canvas.width - 10, canvasY - 5);
  }

  // Dessin des ascenseurs
  elevators.forEach((elevator) => {
    elevator.draw();
  });
  // Dessin des passagers
  characters.forEach((character) => {
    character.draw();
  });

  updateUI();
}

/**
 * \brief Dessin initial après reset
 */
function setupElevators() {
  drawBuilding();
}

// =================== BOUCLE DE JEU ===================
/**
 * \brief La boucle principale (appelée via requestAnimationFrame)
 *  - Redessine le bâtiment
 *  - Fait update() des ascenseurs IA
 */
function gameLoop() {
  drawBuilding();
  elevators.forEach(e => {
    if (e.isAI) e.update();
  });
  requestAnimationFrame(gameLoop);
}

// =================== EVENT LISTENER SUR LE CANVAS (CLIC) ===================
canvas.addEventListener('click', function(event) {
  const config = levelConfig[selectedElevatorCount][level];
  const floorHeight = canvas.height / config.floors;
  const rect = canvas.getBoundingClientRect();

  // [1] AJOUT DU RATIO D'ÉCHELLE
  const scaleX = canvas.width / rect.width;   // ratio horizontal
  const scaleY = canvas.height / rect.height; // ratio vertical

  // [2] UTILISATION DE CE RATIO DANS LE CALCUL DU CLIC
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  let clickedElevator = null;
  // Détection si clic sur un ascenseur
  elevators.forEach(elevator => {
    const x = 200 + elevator.id * 180; 
    const baseWidth = 80;
    const widthPerCapacity = 20;
    const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);

    const floorH = canvas.height / config.floors;
    const elevatorHeight = floorH; 
    const y = canvas.height - (elevator.currentFloor * floorH) - elevatorHeight;

    if (
      clickX >= x &&
      clickX <= x + elevatorWidth &&
      clickY >= y &&
      clickY <= y + elevatorHeight
    ) {
      clickedElevator = elevator;
    }
  });

  // Gérer la sélection
  if (clickedElevator) {
    if (selectedElevator === clickedElevator) {
      selectedElevator = null;
      console.log(`Ascenseur ${clickedElevator.id + 1} déselectionné.`);
    } else {
      selectedElevator = clickedElevator;
      console.log(`Ascenseur ${clickedElevator.id + 1} sélectionné.`);
    }
    drawBuilding();
    return;
  }

  // Déterminer l’étage cliqué
  const floorNum = Math.floor((canvas.height - clickY) / floorHeight);
  const targetFloor = Math.max(0, Math.min(config.floors - 1, floorNum));

  // Vérifier dans la colonne ascenseurs
  clickedElevator = null;
  elevators.forEach(elevator => {
    const x = 200 + elevator.id * 180; 
    const baseWidth = 80;
    const widthPerCapacity = 20;
    const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);

    if (clickX >= x && clickX <= x + elevatorWidth) {
      clickedElevator = elevator;
    }
  });

  // Si ascenseur non-IA, on peut le déplacer
  if (clickedElevator && !clickedElevator.isAI) {
    console.log(`Ascenseur ${clickedElevator.id + 1} sélectionné pour aller à l'étage ${targetFloor}`);
    clickedElevator.moveToFloor(targetFloor);
    drawBuilding();
  } else if (clickedElevator && clickedElevator.isAI) {
    console.log("Cet ascenseur est contrôlé par l’IA, vous ne pouvez pas le commander !");
  } else {
    console.log("Aucun ascenseur sélectionné. Cliquez sur une colonne d'ascenseur.");
  }
});

// =================== INITIALISATION DU JEU ===================
/**
 * \brief initGame() : appelé au chargement, configure tous les events du DOM
 */
function initGame() {
  console.log("Initialisation du jeu...");

  // Bouton “Démarrer le niveau” : on dé-mute la musique si nécessaire, puis startLevel
  document.getElementById("startButton").addEventListener("click", () => {
    const bgMusicEl = document.getElementById("bgMusic");
    if (bgMusicEl && bgMusicEl.muted) {
      bgMusicEl.muted = false;
      bgMusicEl.play().catch(err => {
        console.warn("Toujours bloqué…", err);
      });
    }
    startLevel();
  });

  // Bouton “Confirmer” du choix d’ascenseurs
  const confirmButton = document.getElementById("confirmElevatorCountButton");
  confirmButton.addEventListener("click", () => {
    const elevatorInput = document.getElementById("elevatorCountInput");
    const val = parseInt(elevatorInput.value, 10);
    if (!isNaN(val) && val >= 1) {
      selectedElevatorCount = val;
    } else {
      selectedElevatorCount = 1;
    }

    document.getElementById("overlay").style.display = "none";
    document.getElementById("startButton").disabled = false;

    console.log(`Nombre d'ascenseurs sélectionné : ${selectedElevatorCount}`);
  });

  // Bouton Home => overlay de confirmation si partie en cours
  const homeButton = document.getElementById("homeButton");
  const confirmOverlay = document.getElementById("confirm-overlay");
  const confirmYesButton = document.getElementById("confirmYesButton");
  const confirmNoButton = document.getElementById("confirmNoButton");

  homeButton.addEventListener("click", () => {
    if (gameRunning) {
      confirmOverlay.style.display = "flex";
    } else {
      returnToHome();
    }
  });
  confirmYesButton.addEventListener("click", () => {
    confirmOverlay.style.display = "none";
    returnToHome();
  });
  confirmNoButton.addEventListener("click", () => {
    confirmOverlay.style.display = "none";
  });

  /**
   * \brief Retourne à l’écran d’accueil (arrête partie, resets).
   */
  function returnToHome() {
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    level = 1;
    gameRunning = false;

    score = 0;
    scoreAI = 0;
    updateScore();

    elevators.length = 0;
    characters.length = 0;

    const config = levelConfig[selectedElevatorCount][level];
    for (let i = 0; i < selectedElevatorCount; i++) {
      elevators.push(new Elevator(i, config.capacity, false));
    }
    drawBuilding();

    document.getElementById("overlay").style.display = "none";
    document.getElementById("mode-overlay").style.display = "flex";
    document.getElementById("startButton").disabled = true;

    console.log("Retour à l'écran d'accueil : partie arrêtée, jeu réinitialisé.");
  }

  // Paramètres (thème)
  const settingsButton = document.getElementById("settingsButton");
  const settingsOverlay = document.getElementById("settings-overlay");
  const themeSelect = document.getElementById("themeSelect");
  const applySettingsButton = document.getElementById("applySettingsButton");
  const cancelSettingsButton = document.getElementById("cancelSettingsButton");

  settingsButton.addEventListener("click", () => {
    settingsOverlay.style.display = "flex";
  });
  applySettingsButton.addEventListener("click", () => {
    const selectedTheme = themeSelect.value;
    document.body.classList.remove("default-theme", "retro-theme", "night-theme");
    document.body.classList.add(`${selectedTheme}-theme`);
    settingsOverlay.style.display = "none";
  });
  cancelSettingsButton.addEventListener("click", () => {
    settingsOverlay.style.display = "none";
  });

  // Overlay “mode de jeu”
  const modeOverlay = document.getElementById("mode-overlay");
  modeOverlay.style.display = "flex";

  const soloModeButton = document.getElementById("soloModeButton");
  const aiModeButton = document.getElementById("aiModeButton");
  const onlineModeButton = document.getElementById("onlineModeButton");

  // Conteneur difficulté IA
  const aiDifficultyContainer = document.getElementById("aiDifficultyContainer");

  // Mode Solo
  soloModeButton.addEventListener("click", () => {
    isAIMode = false;
    modeOverlay.style.display = "none";

    // Affiche l'overlay du nombre d'ascenseurs
    document.getElementById("overlay").style.display = "flex";
    aiDifficultyContainer.style.display = "none";
    document.getElementById("confirmElevatorCountButton").style.display = "inline-block";
  });

  // IA
  aiModeButton.addEventListener("click", () => {
    isAIMode = true;
    modeOverlay.style.display = "none";

    document.getElementById("overlay").style.display = "flex";
    aiDifficultyContainer.style.display = "block";
    document.getElementById("confirmElevatorCountButton").style.display = "none";
  });

  // 1 vs 1 en ligne (non implémenté)
  onlineModeButton.addEventListener("click", () => {
    alert("Mode 1 vs 1 en ligne pas encore implémenté !");
  });

  // Boutons difficulté IA
  const easyBtn = document.getElementById("easyAIModeButton");
  const mediumBtn = document.getElementById("mediumAIModeButton");
  const hardBtn = document.getElementById("hardAIModeButton");

  /**
   * \brief Fixe la difficulté de l’IA (aiDecisionDelay),
   *        lit le nb ascenseurs et ferme l’overlay
   */
  function setAIDifficulty(difficultyDelay) {
    aiDecisionDelay = difficultyDelay;

    const elevatorInput = document.getElementById("elevatorCountInput");
    const val = parseInt(elevatorInput.value, 10);
    if (!isNaN(val) && val >= 1) {
      selectedElevatorCount = val;
    } else {
      selectedElevatorCount = 1;
    }

    document.getElementById("overlay").style.display = "none";
    document.getElementById("startButton").disabled = false;
  }

  easyBtn.addEventListener("click", () => { setAIDifficulty(2000); });
  mediumBtn.addEventListener("click", () => { setAIDifficulty(1500); });
  hardBtn.addEventListener("click", () => { setAIDifficulty(1000); });

  // Premier dessin + lancement de la boucle
  drawBuilding();
  requestAnimationFrame(gameLoop);

  console.log("Jeu initialisé.");
}

//! \brief Lance initGame() après chargement de la page
window.onload = initGame;
