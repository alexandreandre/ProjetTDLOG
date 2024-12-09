// Vérification de l'exécution du script
console.log("game.js chargé correctement.");

// Initialisation du canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables de jeu
let score = 0;
let level = 1;
let timer = 25;
let timerInterval;
let spawnInterval;
let gameRunning = false;
let selectedElevator = null;
let selectedElevatorCount = 1; // Valeur par défaut

const elevators = [];
const characters = [];


// Configuration des niveaux avec capacité des ascenseurs et le paramètre floors
const levelConfig =  {1: { // Configs pour 1 ascenseur
    1: { spawnSpeed: 1750, elevatorSpeed: 200, scoreToPass: 70, capacity: 1, floors: 10,
        elevatorColor: "blue", movingElevatorColor: "pink", passengerColor: "blue"
     },
    2: { spawnSpeed: 2000, elevatorSpeed: 300, scoreToPass: 100, capacity: 1, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    3: { spawnSpeed: 1500, elevatorSpeed: 200, scoreToPass: 150, capacity: 1, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     }
},
2: { // Configs pour 2 ascenseurs
    1: { spawnSpeed: 1500, elevatorSpeed: 180, scoreToPass: 80, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    2: { spawnSpeed: 1800, elevatorSpeed: 250, scoreToPass: 120, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    3: { spawnSpeed: 1400, elevatorSpeed: 180, scoreToPass: 160, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     }
},
3: { // Configs pour 3 ascenseurs
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     }
},
4: { // Configs pour 3 ascenseurs
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     }
},
5: { // Configs pour 3 ascenseurs
    1: { spawnSpeed: 1300, elevatorSpeed: 160, scoreToPass: 90, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    2: { spawnSpeed: 1600, elevatorSpeed: 220, scoreToPass: 140, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     },
    3: { spawnSpeed: 1200, elevatorSpeed: 160, scoreToPass: 180, capacity: 2, floors: 10,
        elevatorColor: "gray", movingElevatorColor: "orange", passengerColor: "blue"
     }
},}
// Ajoutez 
  

// Classe Ascenseur
class Elevator {
    constructor(id, capacity) {
        this.id = id;
        this.capacity = capacity; // Capacité définie par le niveau
        this.currentFloor = 0;
        this.destinationFloor = null;
        this.passengers = [];
        this.moving = false;
        console.log(`Ascenseur ${this.id + 1} initialisé avec une capacité de ${this.capacity}`);
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
            if (this.currentFloor + direction < 0 || this.currentFloor + direction >= config.floors) {
                clearInterval(moveInterval);
                this.moving = false;
                console.log(`Ascenseur ${this.id + 1} a atteint la limite des étages.`);
                return;
            }

            this.currentFloor += direction;
            console.log(`Ascenseur ${this.id + 1} est maintenant à l'étage ${this.currentFloor}`);

            if (this.currentFloor === floor) {
                clearInterval(moveInterval);
                this.moving = false;
                this.unloadPassengers();
                this.loadPassengers();
            }
            drawBuilding(); // Mettre à jour l'affichage à chaque mouvement
        }, config.elevatorSpeed);
    }

    loadPassenger(passenger) {
        if (this.passengers.length < this.capacity) {
            this.passengers.push(passenger);
            console.log(`Passager embarqué dans l'ascenseur ${this.id + 1} pour l'étage ${passenger.destinationFloor}`);
            return true;
        }
        console.log(`Ascenseur ${this.id + 1} plein. Passager ne peut pas embarquer.`);
        return false;
    }

    unloadPassengers() {
        const initialCount = this.passengers.length;
        this.passengers = this.passengers.filter(p => {
            if (p.destinationFloor === this.currentFloor) {
                score += 10; // Exemple de score
                console.log(`Passager déchargé à l'étage ${this.currentFloor}`);
                return false;
            }
            return true;
        });
        const unloaded = initialCount - this.passengers.length;
        if (unloaded > 0) {
            updateScore();
        }
    }

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
        const floorHeight = canvas.height / config.floors;
        const x = 200 + this.id * 180;
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * this.capacity);
        const elevatorHeight = 60;
        const y = canvas.height - (this.currentFloor * floorHeight) - elevatorHeight;

        const elevatorColor = this.moving ? config.movingElevatorColor : config.elevatorColor;
        ctx.fillStyle = elevatorColor;
        ctx.fillRect(x, y, elevatorWidth, elevatorHeight);

        ctx.fillRect(x, y, elevatorWidth, elevatorHeight);

        const spacing = elevatorWidth / (this.capacity + 1);
        for (let i = 0; i < this.capacity; i++) {
            const passengerX = x + spacing * (i + 1);
            const passengerY = y + elevatorHeight / 2;

            if (i < this.passengers.length) {
                const passenger = this.passengers[i];
                ctx.fillStyle = config.passengerColor;

                ctx.beginPath();
                ctx.arc(passengerX, passengerY, 8, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.font = '10px Arial';
                ctx.fillText(`${passenger.destinationFloor}`, passengerX, passengerY + 3);
            } else {
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(passengerX, passengerY, 8, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText(`A${this.id + 1}`, x + elevatorWidth / 2, y + elevatorHeight - 5);

        if (selectedElevator === this) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, elevatorWidth, elevatorHeight);
        }
    }
}

// Classe Personnage
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

        const x = 100 - localIndex * 20;
        const y = canvas.height - (this.currentFloor * floorHeight) - 20;

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = config.passengerColor;
        ctx.fill();

        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        ctx.fillText(this.destinationFloor, x, y + 4);
    }
}

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


function resetGame(config) {
    score = 0;
    characters.length = 0;
    elevators.length = 0;
    selectedElevator = null;

    for (let i = 0; i < selectedElevatorCount; i++) {
        elevators.push(new Elevator(i, config.capacity));
    }
    console.log(`${selectedElevatorCount} ascenseur(s) initialisé(s) avec une capacité de ${config.capacity}`);

    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnCharacter, config.spawnSpeed);
    updateUI();
}



function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

function updateLevel() {
    document.getElementById('level').innerText = `Niveau: ${level}`;
}

function updateUI() {
    updateScore();
    updateLevel();
}

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

function checkLevelCompletion() {
    gameRunning = false;
    document.getElementById("startButton").disabled = false;

    const config = levelConfig[selectedElevatorCount][level];
    if (score >= config.scoreToPass) {
        alert(`Niveau ${level} terminé ! Vous passez au niveau ${level + 1}.`);
        level++;
    } else {
        alert(`Niveau ${level} échoué. Essayez à nouveau.`);
    }

    if (level > Object.keys(levelConfig[selectedElevatorCount]).length) {
        alert("Félicitations ! Vous avez terminé tous les niveaux !");
        level = 1;
    }
}

function spawnCharacter() {
    const character = new Character();
    characters.push(character);
    console.log(`Passager ajouté. Total passagers en attente : ${characters.length}`);
}

function drawBuilding() {
    const config = levelConfig[selectedElevatorCount][level];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const floorHeight = canvas.height / config.floors;
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';

    for (let i = 0; i < config.floors; i++) {
        const y = i * floorHeight;
        const canvasY = canvas.height - y;
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillText(`${i}`, canvas.width - 10, canvasY - 5);
    }

    elevators.forEach(elevator => {
        elevator.draw();
    });

    characters.forEach(character => character.draw());

    updateUI();
}

function setupElevators() {
    drawBuilding();
}

function gameLoop() {
    drawBuilding();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', function(event) {
    const config = levelConfig[selectedElevatorCount][level];
    const floorHeight = canvas.height / config.floors;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let clickedElevator = null;
    elevators.forEach(elevator => {
        const x = 100 + elevator.id * 180;
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);
        const elevatorHeight = 60;
        const y = canvas.height - (elevator.currentFloor * floorHeight) - elevatorHeight;
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

    const floorNum = Math.floor((canvas.height - clickY) / floorHeight);
    const targetFloor = Math.max(0, Math.min(config.floors - 1, floorNum));

    clickedElevator = null;
    elevators.forEach(elevator => {
        const x = 200 + elevator.id * 180; ///////////////////////////////////////
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);

        if (clickX >= x && clickX <= x + elevatorWidth) {
            clickedElevator = elevator;
        }
    });

    if (clickedElevator) {
        console.log(`Ascenseur ${clickedElevator.id + 1} sélectionné pour aller à l'étage ${targetFloor}`);
        clickedElevator.moveToFloor(targetFloor);
        drawBuilding();
    } else {
        console.log("Aucun ascenseur sélectionné. Cliquez sur une colonne d'ascenseur.");
    }
});

function initGame() {
    console.log("Initialisation du jeu...");
    document.getElementById("startButton").addEventListener("click", startLevel);

    // Nouveau : Gérer le bouton de confirmation du nombre d'ascenseurs
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

    drawBuilding();
    requestAnimationFrame(gameLoop);
    console.log("Jeu initialisé.");
}

window.onload = initGame;