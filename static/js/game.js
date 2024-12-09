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

const floors = 10;
const elevators = [];
const characters = [];

// Configuration des niveaux avec capacité des ascenseurs
const levelConfig = {
    1: { elevators: 1, spawnSpeed: 1000, elevatorSpeed: 100, scoreToPass: 70, capacity: 1 },
    2: { elevators: 1, spawnSpeed: 1000, elevatorSpeed: 100, scoreToPass: 100, capacity: 3 },
    3: { elevators: 2, spawnSpeed: 1000, elevatorSpeed: 100, scoreToPass: 150, capacity: 3 },
    // Ajoutez plus de niveaux ici
};

// Définir la hauteur des étages
const floorHeight = canvas.height / floors;

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
        const config = levelConfig[level];
        const moveInterval = setInterval(() => {
            // Vérifier si l'ascenseur atteint le plafond ou le sol
            if (this.currentFloor + direction < 0 || this.currentFloor + direction >= floors) {
                clearInterval(moveInterval);
                this.moving = false;
                console.log(`Ascenseur ${this.id + 1} a atteint la limite des étages.`);
                return;
            }

            this.currentFloor += direction;
            console.log(`Ascenseur ${this.id + 1} est maintenant à l'étage ${this.currentFloor}`);

            // Vérifier si l'ascenseur a atteint la destination
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
        // Charger les passagers présents à l'étage actuel
        for (let i = 0; i < characters.length; i++) {
            let character = characters[i];
            if (character.currentFloor === this.currentFloor) {
                if (this.loadPassenger(character)) {
                    characters.splice(i, 1);
                    i--; // Ajuster l'index après suppression
                }
            }
        }
    }

    draw() {
        const x = 100 + this.id * 180; // Espacement ajusté pour éviter le chevauchement
        const baseWidth = 80; // Largeur de base de l'ascenseur
        const widthPerCapacity = 20; // Largeur ajoutée par unité de capacité
        const elevatorWidth = baseWidth + (widthPerCapacity * this.capacity); // Ajuster la largeur en fonction de la capacité
        const elevatorHeight = 60; // Hauteur fixe de l'ascenseur
        const y = canvas.height - (this.currentFloor * floorHeight) - elevatorHeight;

        // Dessiner le rectangle de l'ascenseur
        ctx.fillStyle = this.moving ? 'orange' : 'gray';
        ctx.fillRect(x, y, elevatorWidth, elevatorHeight);

        // Afficher les passagers (cercles remplis et vides alignés horizontalement)
        const spacing = elevatorWidth / (this.capacity + 1);
        for (let i = 0; i < this.capacity; i++) {
            const passengerX = x + spacing * (i + 1);
            const passengerY = y + elevatorHeight / 2;

            if (i < this.passengers.length) {
                // Passager présent avec numéro d'étage
                const passenger = this.passengers[i];
                ctx.fillStyle = 'blue';
                ctx.beginPath();
                ctx.arc(passengerX, passengerY, 8, 0, 2 * Math.PI);
                ctx.fill();

                // Afficher le numéro de l'étage dans le cercle
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.font = '10px Arial';
                ctx.fillText(`${passenger.destinationFloor}`, passengerX, passengerY + 3);
            } else {
                // Cercle vide
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(passengerX, passengerY, 8, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        // Afficher l'ID de l'ascenseur
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText(`A${this.id + 1}`, x + elevatorWidth / 2, y + elevatorHeight - 5);

        // Afficher une bordure si l'ascenseur est sélectionné
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
        this.currentFloor = Math.floor(Math.random() * floors);
        this.destinationFloor = this.getRandomDestinationFloor(this.currentFloor);
        console.log(`Nouveau passager à l'étage ${this.currentFloor} voulant aller à l'étage ${this.destinationFloor}`);
    }

    getRandomDestinationFloor(excludeFloor) {
        let floor;
        do {
            floor = Math.floor(Math.random() * floors);
        } while (floor === excludeFloor);
        return floor;
    }

    static getCharactersOnFloor(floor) {
        return characters.filter(character => character.currentFloor === floor);
    }

    draw() {
        const charactersOnSameFloor = Character.getCharactersOnFloor(this.currentFloor);
        const localIndex = charactersOnSameFloor.indexOf(this);

        const x = 100 - localIndex * 20;
        const y = canvas.height - (this.currentFloor * floorHeight) - 20;

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        ctx.fillText(this.destinationFloor, x, y + 4);
    }
}

// Démarrer le niveau
function startLevel() {
    if (gameRunning) {
        console.log("Le jeu est déjà en cours.");
        return;
    }
    console.log("Démarrage du niveau...");
    gameRunning = true;

    const config = levelConfig[level];
    resetGame(config);
    setupElevators(); // Créer les ascenseurs visuels

    document.getElementById("startButton").disabled = true;
    startTimer();
    console.log(`Niveau ${level} démarré.`);
}

// Réinitialiser le jeu pour un niveau
function resetGame(config) {
    score = 0;
    characters.length = 0;
    elevators.length = 0;
    selectedElevator = null;

    for (let i = 0; i < config.elevators; i++) {
        elevators.push(new Elevator(i, config.capacity));
    }
    console.log(`${config.elevators} ascenseur(s) initialisé(s) avec une capacité de ${config.capacity}`);

    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnCharacter, config.spawnSpeed);
    updateUI();
}

// Mettre à jour le score affiché
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

// Mettre à jour le niveau affiché
function updateLevel() {
    document.getElementById('level').innerText = `Niveau: ${level}`;
}

// Mettre à jour l'interface utilisateur
function updateUI() {
    updateScore();
    updateLevel();
}

// Démarrer le timer
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

// Vérifier si le niveau est réussi
function checkLevelCompletion() {
    gameRunning = false;
    document.getElementById("startButton").disabled = false;

    if (score >= levelConfig[level].scoreToPass) {
        alert(`Niveau ${level} terminé ! Vous passez au niveau ${level + 1}.`);
        level++;
    } else {
        alert(`Niveau ${level} échoué. Essayez à nouveau.`);
    }

    if (level > Object.keys(levelConfig).length) {
        alert("Félicitations ! Vous avez terminé tous les niveaux !");
        level = 1;
    }
}

// Génération de personnages aléatoires
function spawnCharacter() {
    const character = new Character();
    characters.push(character);
    console.log(`Passager ajouté. Total passagers en attente : ${characters.length}`);
}

// Dessiner le bâtiment et les étages
function drawBuilding() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner les étages
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    for (let i = 0; i < floors; i++) {
        const y = i * floorHeight;
        const canvasY = canvas.height - y;
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();

        // Afficher le numéro de l'étage sur le côté droit
        ctx.fillStyle = 'black';
        ctx.fillText(`${i}`, canvas.width - 10, canvasY - 5);
    }

    // Dessiner les ascenseurs
    elevators.forEach(elevator => {
        elevator.draw();
    });

    // Dessiner les personnages
    characters.forEach(character => character.draw());

    // Mettre à jour le score et le niveau
    updateUI();
}

// Créer les ascenseurs visuels (appelé après la réinitialisation du jeu)
function setupElevators() {
    drawBuilding();
}

// Boucle de jeu
function gameLoop() {
    drawBuilding();
    requestAnimationFrame(gameLoop);
}

// Événement de clic sur le canvas
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Vérifier si un ascenseur a été cliqué
    let clickedElevator = null;
    elevators.forEach(elevator => {
        const x = 100 + elevator.id * 180; // Ajusté pour correspondre à la nouvelle position
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * elevator.capacity);
        const elevatorHeight = 60; // Hauteur fixe
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
            // Déselectionner si déjà sélectionné
            selectedElevator = null;
            console.log(`Ascenseur ${clickedElevator.id + 1} déselectionné.`);
        } else {
            selectedElevator = clickedElevator;
            console.log(`Ascenseur ${clickedElevator.id + 1} sélectionné.`);
        }
        drawBuilding(); // Mettre à jour l'affichage pour montrer la sélection
        return;
    }

    // Si un ascenseur est sélectionné, vérifier si un étage a été cliqué
    if (selectedElevator) {
        // Déterminer l'étage cliqué en fonction de Y
        const floorNum = Math.floor((canvas.height - clickY) / floorHeight);
        const targetFloor = Math.max(0, Math.min(floors - 1, floorNum));

        console.log(`Étape cible sélectionnée : Étage ${targetFloor}`);

        // Déplacer l'ascenseur sélectionné vers l'étage cible
        selectedElevator.moveToFloor(targetFloor);
        selectedElevator = null; // Déselectionner après avoir donné l'ordre
        drawBuilding(); // Mettre à jour l'affichage
    }
});

// Initialiser le jeu
function initGame() {
    console.log("Initialisation du jeu...");
    document.getElementById("startButton").addEventListener("click", startLevel);
    drawBuilding();
    requestAnimationFrame(gameLoop);
    console.log("Jeu initialisé.");
}

window.onload = initGame;
