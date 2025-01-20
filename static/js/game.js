// Vérification de l'exécution du script
console.log("game.js chargé correctement.");

// Initialisation du canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// =================== VARIABLES GLOBALES ===================
let score = 0;
let scoreAI = 0; // --- AJOUT pour IA (son propre score)
let level = 1;
let timer = 25;
let timerInterval;
let spawnInterval;
let gameRunning = false;
let selectedElevator = null;
let selectedElevatorCount = 1; // Valeur par défaut

// --- AJOUT pour IA : petit booléen qui indique si on est en mode "1 vs 1 IA"
let isAIMode = false;
let aiDecisionDelay = 0; // En millisecondes, 0 par défaut (difficile)


const elevators = [];
const characters = [];

// =================== CONFIGURATIONS DE NIVEAU ===================
const levelConfig = {
    1: {
        1: { spawnSpeed: 1300, elevatorSpeed: 200, scoreToPass: 70, capacity: 1, floors: 5,
            elevatorColor: "blue", movingElevatorColor: "pink", passengerColor: "blue"
        },
        2: { spawnSpeed: 2000, elevatorSpeed: 150, scoreToPass: 100, capacity: 1, floors: 8,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        3: { spawnSpeed: 1400, elevatorSpeed: 50, scoreToPass: 140, capacity: 1, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        4: { spawnSpeed: 1300, elevatorSpeed: 10, scoreToPass: 160, capacity: 1, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "lime"
        }
    },
    2: {
        1: { spawnSpeed: 1700, elevatorSpeed: 500, scoreToPass: 50, capacity: 1, floors: 5,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        2: { spawnSpeed: 1700, elevatorSpeed: 400, scoreToPass: 90, capacity: 1, floors: 8,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        3: { spawnSpeed: 2000, elevatorSpeed: 300, scoreToPass: 110, capacity: 1, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        }
    },
    3: {
        1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90,  capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        }
    },
    4: {
        1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90,  capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        }
    },
    5: {
        1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90,  capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        },
        3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
            elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
        }
    }
};

// =================== UTILITAIRE DESSIN RECTANGLE ARRONDI ===================
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
class Elevator {
    constructor(id, capacity, isAI = false) { // --- AJOUT paramètre isAI
        this.id = id;
        this.capacity = capacity; 
        this.currentFloor = 0;
        this.destinationFloor = null;
        this.passengers = [];
        this.moving = false;
        this.isAI = isAI; // --- Indique si c'est un ascenseur IA
        this.nextDecisionTime = 0;
        console.log(`Ascenseur ${this.id + 1} initialisé (isAI=${isAI}) avec une capacité de ${this.capacity}`);
    }

    // -----------------
    // Méthode appelée dans la boucle gameLoop() si c’est un ascenseur IA
    // -----------------
    update() {
        // IA : si pas en mouvement, on charge les passagers sur l’étage
        if (!this.moving) {
            this.loadPassengersOnCurrentFloor();
        }
        // Logique auto
        if (this.isAI) {
            this.autoMove();
        }
    }

    // -----------
    // Charge tous les passagers présents à l’étage courant
    // (uniquement si l’ascenseur est à l’arrêt)
    // -----------
    loadPassengersOnCurrentFloor() {
        for (let i = 0; i < characters.length; i++) {
            const c = characters[i];
            if (c.currentFloor === this.currentFloor && this.passengers.length < this.capacity) {
                const loaded = this.loadPassenger(c, true); 
                if (loaded) {
                    // On retire ce personnage du tableau global
                    characters.splice(i, 1);
                    i--;
                }
            }
        }
    }

    // -----------
    // Logique auto : si j'ai un passager, je vais à son étage de destination
    // sinon je cherche le plus proche passager
    // -----------
    autoMove() {
        if (this.moving) return; // déjà en mouvement => on ne fait rien

         // Vérifier le délai IA
        if (Date.now() < this.nextDecisionTime) {
            // Pas encore le moment de reprendre une décision
            return;
        }

        // 1. Si on a des passagers, on va les déposer
        if (this.passengers.length > 0) {
            const nextDest = this.passengers[0].destinationFloor;
            this.moveToFloor(nextDest);
            // On fixe le prochain moment où l’IA pourra redécider
            this.nextDecisionTime = Date.now() + aiDecisionDelay;
            return;
        }

       // 2. Sinon, on cherche le passager le plus proche
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
            if (
                this.currentFloor + direction < 0 ||
                this.currentFloor + direction >= config.floors
            ) {
                clearInterval(moveInterval);
                this.moving = false;
                console.log(`Ascenseur ${this.id + 1} a atteint la limite des étages.`);
                return;
            }

            this.currentFloor += direction;
            // console.log(`Ascenseur ${this.id + 1} est maintenant à l'étage ${this.currentFloor}`);

            if (this.currentFloor === floor) {
                clearInterval(moveInterval);
                this.moving = false;
                this.unloadPassengers();
                this.loadPassengers(); // chargement passagers instantané
            }
            drawBuilding(); // Mettre à jour l'affichage à chaque mouvement
        }, config.elevatorSpeed);
    }

    // On peut passer un petit flag pour distinguer passager IA ou non si on voulait.
    loadPassenger(passenger) {
        if (this.passengers.length < this.capacity) {
            this.passengers.push(passenger);
            console.log(`Passager embarqué dans ascenseur ${this.id + 1} => destination ${passenger.destinationFloor}`);
            return true;
        }
        console.log(`Ascenseur ${this.id + 1} plein. Passager ne peut pas embarquer.`);
        return false;
    }

    unloadPassengers() {
        const initialCount = this.passengers.length;
        this.passengers = this.passengers.filter((p) => {
            if (p.destinationFloor === this.currentFloor) {
                // --- SI c'est un ascenseur IA, on incrémente scoreAI, sinon score du joueur
                if (this.isAI) {
                    scoreAI += 10;
                } else {
                    score += 10;
                }
                return false; // on enlève ce passager
            }
            return true;
        });
        const unloaded = initialCount - this.passengers.length;
        if (unloaded > 0) {
            updateScore(); // pour mettre à jour l'UI
        }
    }

    // Appelé quand on arrive à un étage (fin de moveToFloor)
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

    draw() {
        const config = levelConfig[selectedElevatorCount][level];
        // On calcule la hauteur d'un étage
        const floorHeight = canvas.height / config.floors;
        
        const elevatorHeight = floorHeight; 
        const x = 200 + this.id * 180;
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * this.capacity);

        const y = canvas.height - (this.currentFloor * floorHeight) - elevatorHeight;

        // On crée un dégradé vertical
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

        // Dessin du rectangle arrondi
        roundRect(ctx, x, y, elevatorWidth, elevatorHeight, 10);

        // Dessin des passagers
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

        // Surligner l’ascenseur sélectionné
        if (selectedElevator === this) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, elevatorWidth, elevatorHeight);
        }
    }
}

// =================== CLASSE CHARACTER ===================
class Character {
    constructor() {
        const config = levelConfig[selectedElevatorCount][level];
        this.currentFloor = Math.floor(Math.random() * config.floors);
        this.destinationFloor = this.getRandomDestinationFloor(this.currentFloor, config.floors);
        console.log(`Nouveau passager à l'étage ${this.currentFloor} voulant aller à l'étage ${this.destinationFloor}`);
    }

    getRandomDestinationFloor(excludeFloor, totalFloors) {
        let floor;
        do {
            floor = Math.floor(Math.random() * totalFloors);
        } while (floor === excludeFloor);
        return floor;
    }

    static getCharactersOnFloor(floor) {
        return characters.filter(character => character.currentFloor === floor);
    }

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

        // Destination du passager
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = `bold ${characterRadius * 1.4}px Arial`; 
        ctx.fillText(this.destinationFloor, x, y + (characterRadius * 0.4)+1);
    }
}

// =================== DEMARRAGE DE NIVEAU ===================
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

// =================== RESET DE LA PARTIE POUR LE NIVEAU ===================
function resetGame(config) {
    score = 0;
    scoreAI = 0; // --- Réinitialiser le score de l’IA aussi
    characters.length = 0;
    elevators.length = 0;
    selectedElevator = null;

    // --- Si isAIMode == true, on veut 2 x selectedElevatorCount ascenseurs
    // L’utilisateur aura les ascenseurs d’ID 0..(n-1) en mode manuel
    // L’IA aura les ascenseurs d’ID n..(2n-1) en mode auto
    if (isAIMode) {
        // Ascenseurs Joueur
        for (let i = 0; i < selectedElevatorCount; i++) {
            elevators.push(new Elevator(i, config.capacity, false));
        }
        // Ascenseurs IA
        for (let i = 0; i < selectedElevatorCount; i++) {
            const eAI = new Elevator(selectedElevatorCount + i, config.capacity, true);
            // Empêcher la première décision instantanée
            eAI.nextDecisionTime = Date.now() + aiDecisionDelay;
            elevators.push(eAI);
        }
    } else {
        // Mode normal (solo) : pas d’IA => pas de nextDecisionTime à ajuster
        for (let i = 0; i < selectedElevatorCount; i++) {
            elevators.push(new Elevator(i, config.capacity, false));
        }
    }
    

    console.log(`${elevators.length} ascenseur(s) initialisé(s).`);

    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnCharacter, config.spawnSpeed);
    updateUI();
}

function updateScore() {
    const scoreLine = document.getElementById('score-line');

    if (!scoreLine) {
        console.error("L'élément #score-line est introuvable.");
        return;
    }

    if (isAIMode) {
        // Mode 1v1 IA
        scoreLine.classList.remove('solo-mode'); // Supprime la classe solo
        scoreLine.innerHTML = `<span id="user-score" style="color: green;">${score}</span>-<span id="ia-score" style="color: red;">${scoreAI}</span>`;
    } else {
        // Mode solo
        scoreLine.classList.add('solo-mode'); // Ajoute la classe solo
        scoreLine.innerHTML = `
            Score : <span id="user-score" style="color: #00ffea;">${score}</span>
        `;
    }
}







function updateLevel() {
    document.getElementById('level').innerText = `Niveau: ${level}`;
}

function updateUI() {
    updateScore();     
    updateLevel();     

    const config = levelConfig[selectedElevatorCount][level];
    document.getElementById('scoreToPass').innerText = `À atteindre : ${config.scoreToPass}`;
}

// =================== TIMER ===================
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

// =================== FIN DE PARTIE / CHECK NIVEAU ===================
function checkLevelCompletion() {
    gameRunning = false;
    document.getElementById("startButton").disabled = false;

    const config = levelConfig[selectedElevatorCount][level];
    // Si on est en mode IA, on pourrait comparer score vs scoreAI
    if (isAIMode) {
        // Ex.: condition de victoire si le joueur dépasse l’IA ET >= scoreToPass
        if (score >= config.scoreToPass && score > scoreAI) {
            victoryOverlay(`Vous avez battu l'IA avec ${score} contre ${scoreAI}! Niveau terminé !`);
            level++;
        } else {
            failOverlay(`L'IA vous a battu (${scoreAI} contre ${score}), ou vous n'avez pas le score requis (${score}/${config.scoreToPass}).`);
        }
    } else {
        // --- Mode Solo classique
        if (score >= config.scoreToPass) {
            // --- NIVEAU RÉUSSI ---
            victoryOverlay(`Niveau ${level} terminé ! Vous passez au niveau ${level + 1}.`);
            level++;
        } else {
            failOverlay(`Niveau ${level} échoué. Essayez à nouveau !`);
        }
    }

    // Vérification si on a dépassé le nombre de niveaux
    if (level > Object.keys(levelConfig[selectedElevatorCount]).length) {
        alert("Félicitations ! Vous avez terminé tous les niveaux !");
        level = 1;
    }
}

// ------------------ FONCTIONS OVERLAYS DE VICTOIRE / DEFAITE ------------------
function victoryOverlay(message) {
    const levelUpText = document.getElementById("level-up-text");
    levelUpText.innerText = message;
    const levelUpOverlay = document.getElementById("level-up-overlay");
    levelUpOverlay.style.display = "flex";
    setTimeout(() => {
        levelUpOverlay.style.display = "none";
    }, 3000);
}

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
function spawnCharacter() {
    const character = new Character();
    characters.push(character);
    console.log(`Passager ajouté. Total passagers en attente : ${characters.length}`);
}

// =================== DESSIN DU BUILDING ===================
function drawBuilding() {
    const config = levelConfig[selectedElevatorCount][level];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const floorHeight = canvas.height / config.floors;

    const labelFontSize = Math.min(32, Math.max(8, floorHeight * 0.3));
    ctx.font = `bold ${labelFontSize}px "Press Start 2P"`;
    ctx.textAlign = 'right';
    ctx.strokeStyle = "#888"; 
    ctx.lineWidth = 1;
    
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

// =================== PREPARATION DES ASCENSEURS (DESSIN INITIAL) ===================
function setupElevators() {
    drawBuilding();
}

// =================== BOUCLE DE JEU ===================
function gameLoop() {
    // Dessiner
    drawBuilding();

    // --- SI on est en mode IA, on appelle update() sur tous les ascenseurs IA
    // (ou sur tous, mais seuls les ascenseurs IA auront un effet)
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
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let clickedElevator = null;
    // Vérifier si clic sur un ascenseur
    // Remarque : dans le dessin, on fait x = 100 + id*180,
    // mais pour la détection existante, Alex utilisait x=200 (un petit décalage).
    // On peut unifier. Ici, je modifie la détection pour coller au x=100.
    // => On calculera la bounding box en fonction du x=100 + elevator.id*180.
    elevators.forEach(elevator => {
        const x = 200 + elevator.id * 180; 
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);
        // On prend la même hauteur qu’au dessin
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

    if (clickedElevator) {
        // Gérer la sélection / déselection
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

    // Déterminer l'étage cliqué
    const floorNum = Math.floor((canvas.height - clickY) / floorHeight);
    const targetFloor = Math.max(0, Math.min(config.floors - 1, floorNum));

    // Vérifier colonne pour déplacer un ascenseur
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

    if (clickedElevator && !clickedElevator.isAI) {
        // On déplace seulement si ce n’est PAS un ascenseur IA
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
function initGame() {
    console.log("Initialisation du jeu...");
    document.getElementById("startButton").addEventListener("click", startLevel);

    // Bouton de confirmation du nombre d'ascenseurs
    const confirmButton = document.getElementById("confirmElevatorCountButton");
    confirmButton.addEventListener("click", () => {
        const elevatorInput = document.getElementById("elevatorCountInput");
        const val = parseInt(elevatorInput.value, 10);
        if (!isNaN(val) && val >= 1) {
            selectedElevatorCount = val;
        } else {
            selectedElevatorCount = 1;
        }

        // Cacher l’overlay
        document.getElementById("overlay").style.display = "none";

        // Activer le bouton "Démarrer le niveau"
        document.getElementById("startButton").disabled = false;

        console.log(`Nombre d'ascenseurs sélectionné : ${selectedElevatorCount}`);
    });

    // Bouton Home
const homeButton = document.getElementById("homeButton");
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmYesButton = document.getElementById("confirmYesButton");
const confirmNoButton = document.getElementById("confirmNoButton");

homeButton.addEventListener("click", () => {
    if (gameRunning) {
        // Si une partie est en cours, afficher l'overlay de confirmation
        confirmOverlay.style.display = "flex";
    } else {
        // Sinon, retour à l'accueil directement
        returnToHome();
    }
});

// Bouton "Oui" dans la confirmation
confirmYesButton.addEventListener("click", () => {
    // Fermer l'overlay de confirmation
    confirmOverlay.style.display = "none";

    // Retourner à l'écran d'accueil
    returnToHome();
});

// Bouton "Non" dans la confirmation
confirmNoButton.addEventListener("click", () => {
    // Fermer l'overlay de confirmation et continuer la partie
    confirmOverlay.style.display = "none";
});

// Fonction pour retourner à l'accueil (arrête la partie)
function returnToHome() {
    // 1. Arrêter la partie
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    gameRunning = false;

    // 2. Réinitialiser les scores
    score = 0;
    scoreAI = 0;
    updateScore();

    // 3. Réinitialiser les ascenseurs et passagers
    elevators.length = 0;
    characters.length = 0;
    const config = levelConfig[selectedElevatorCount][level];
    for (let i = 0; i < selectedElevatorCount; i++) {
        elevators.push(new Elevator(i, config.capacity, false));
    }

    // 4. Redessiner le bâtiment à son état initial
    drawBuilding();

    // 5. Masquer tous les overlays de jeu
    document.getElementById("overlay").style.display = "none";

    // 6. Afficher à nouveau l'overlay de choix du mode
    const modeOverlay = document.getElementById("mode-overlay");
    modeOverlay.style.display = "flex";

    // 7. Désactiver le bouton "Démarrer"
    document.getElementById("startButton").disabled = true;

    console.log("Retour à l'écran d'accueil : partie arrêtée, jeu réinitialisé.");
}



    

    // Paramètres
    const settingsButton = document.getElementById("settingsButton");
    const settingsOverlay = document.getElementById("settings-overlay");
    const themeSelect = document.getElementById("themeSelect");
    const applySettingsButton = document.getElementById("applySettingsButton");
    const cancelSettingsButton = document.getElementById("cancelSettingsButton");

    // Ouvrir menu paramètres
    settingsButton.addEventListener("click", () => {
        settingsOverlay.style.display = "flex";
    });

    // Appliquer le thème
    applySettingsButton.addEventListener("click", () => {
        const selectedTheme = themeSelect.value; // "default", "retro", "night"
        document.body.classList.remove("default-theme", "retro-theme", "night-theme");
        document.body.classList.add(`${selectedTheme}-theme`);
        // Fermer
        settingsOverlay.style.display = "none";
    });

    // Annuler
    cancelSettingsButton.addEventListener("click", () => {
        settingsOverlay.style.display = "none";
    });

    // Afficher le menu « mode de jeu »
    const modeOverlay = document.getElementById("mode-overlay");
    modeOverlay.style.display = "flex";

    // Sélection des boutons de mode
    const soloModeButton = document.getElementById("soloModeButton");
    const aiModeButton = document.getElementById("aiModeButton");
    const onlineModeButton = document.getElementById("onlineModeButton");

    // Mode Solo
    soloModeButton.addEventListener("click", () => {
        isAIMode = false; // On n’est pas en mode IA
        modeOverlay.style.display = "none";
        document.getElementById("overlay").style.display = "flex";
    });

    // 1 vs 1 contre l'IA
    aiModeButton.addEventListener("click", () => {
        isAIMode = true; // On active le mode IA
        modeOverlay.style.display = "none";
        document.getElementById("overlay").style.display = "flex";
        // NOUVEAU : Afficher la sélection de difficulté IA
        document.getElementById("aiDifficultyContainer").style.display = "block";
        // Optionnel : on peut masquer le bouton "Confirmer" si on veut obliger le joueur
        // à cliquer sur Facile/Moyen/Difficile pour lancer la partie
        document.getElementById("confirmElevatorCountButton").style.display = "none";
    });
    // Boutons de difficulté IA
    const easyBtn = document.getElementById("easyAIModeButton");
    const mediumBtn = document.getElementById("mediumAIModeButton");
    const hardBtn = document.getElementById("hardAIModeButton");

    // Fonction qui lit le nombre d'ascenseurs et lance le niveau
    function setAIDifficulty(difficultyDelay) {
        // 1) Fixer le délai de décision de l’IA
        aiDecisionDelay = difficultyDelay;
    
        // 2) Lire la valeur du nombre d'ascenseurs
        const elevatorInput = document.getElementById("elevatorCountInput");
        const val = parseInt(elevatorInput.value, 10);
        if (!isNaN(val) && val >= 1) {
            selectedElevatorCount = val;
        } else {
            selectedElevatorCount = 1;
        }
    
        // 3) Masquer l’overlay et activer le bouton "Démarrer le niveau"
        document.getElementById("overlay").style.display = "none";
        document.getElementById("startButton").disabled = false;
    
        // IMPORTANT : on ne lance PAS startLevel() ici.
    }

    easyBtn.addEventListener("click", () => {
        setAIDifficulty(2000); // 2s
    });
    mediumBtn.addEventListener("click", () => {
        setAIDifficulty(1000); // 1s
    });
    hardBtn.addEventListener("click", () => {
        setAIDifficulty(0); // 0s
    });
    
  
    // 1 vs 1 en ligne (non implémenté)
    onlineModeButton.addEventListener("click", () => {
        alert("Mode 1 vs 1 en ligne pas encore implémenté !");
    });

    // Démarrage du rendu
    drawBuilding();
    requestAnimationFrame(gameLoop);

    console.log("Jeu initialisé.");
}

window.onload = initGame;
