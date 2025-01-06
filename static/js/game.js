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
const levelConfig = {
    1: {
        1: { spawnSpeed: 1750, elevatorSpeed: 200, scoreToPass: 70, capacity: 1, floors: 5,
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
    2: { // Configs pour 2 ascenseurs
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

// Fonction utilitaire pour dessiner un rectangle arrondi
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

// Classe Ascenseur
class Elevator {
    constructor(id, capacity) {
        this.id = id;
        this.capacity = capacity; 
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
        console.log(
          `Ascenseur ${this.id + 1} déplacé de l'étage ${this.currentFloor} à l'étage ${floor}`
        );

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
            console.log(
              `Passager embarqué dans l'ascenseur ${this.id + 1} pour l'étage ${passenger.destinationFloor}`
            );
            return true;
        }
        console.log(`Ascenseur ${this.id + 1} plein. Passager ne peut pas embarquer.`);
        return false;
    }

    unloadPassengers() {
        const initialCount = this.passengers.length;
        this.passengers = this.passengers.filter((p) => {
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
        // On calcule la hauteur d'un étage
        const floorHeight = canvas.height / config.floors;
        
        // Au lieu d'un ascenseur fixe (60px), on l'adapte
        // par exemple 90% de la hauteur de l'étage
        const elevatorHeight = floorHeight ; 
        // On peut aussi adapter la largeur selon la capacité
        const x = 200 + this.id * 180;
        const baseWidth = 80;
        const widthPerCapacity = 20;
        const elevatorWidth = baseWidth + (widthPerCapacity * this.capacity);

        // La position Y dépend de currentFloor
        const y = canvas.height - (this.currentFloor * floorHeight) - elevatorHeight;

        // On crée un dégradé vertical
        const grad = ctx.createLinearGradient(x, y, x, y + elevatorHeight);
        if (this.moving) {
            // Couleurs dégradées si l'ascenseur est en mouvement
            grad.addColorStop(0, "#f5a9f2");
            grad.addColorStop(1, "#d381c3");
        } else {
            // Couleurs dégradées si l'ascenseur est à l’arrêt
            grad.addColorStop(0, "#70f4ff");
            grad.addColorStop(1, "#2cb3bd");
        }

        ctx.fillStyle = grad;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.min(8, Math.max(2, floorHeight * 0.03))+1; // On peut laisser 4 ou adapter

        // Dessin du rectangle arrondi (roundRect)
        roundRect(ctx, x, y, elevatorWidth, elevatorHeight, 10);

        // Dessin des passagers
        const spacing = elevatorWidth / (this.capacity + 1);
        
        // On peut ajuster la taille des passagers
        const passengerRadius = 2*floorHeight**(1/2); // ex. 1/4 de l'ascenseur
        for (let i = 0; i < this.capacity; i++) {
            const passengerX = x + spacing * (i + 1);
            // Position verticale du passager au centre de l'ascenseur
            const passengerY = y + elevatorHeight / 2;

            if (i < this.passengers.length) {
                // Dessiner un cercle pour le passager, dont la taille dépend de l’ascenseur
                ctx.beginPath();
                ctx.arc(passengerX, passengerY, passengerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = "#ff00d4";
                ctx.fill();

                // Épaisseur de contour proportionnelle au rayon
                const dynamicStroke = Math.min(8, Math.max(2, passengerRadius * 0.2))+1;
                ctx.lineWidth = dynamicStroke;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();


                // Affichage du floor de destination : on adapte aussi la taille de police
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = `bold ${passengerRadius * 1.2}px Arial`;
                ctx.fillText(
                  `${this.passengers[i].destinationFloor}`,
                  passengerX,
                  passengerY + (passengerRadius * 0.4)
                );
            } else {
                // Emplacement vide
                ctx.beginPath();
                ctx.arc(passengerX, passengerY, passengerRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = "#fff";
                ctx.stroke();
            }
        }

        // Si l’ascenseur est sélectionné, on dessine un contour jaune
        if (selectedElevator === this) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, elevatorWidth, elevatorHeight);
        }
    }
}


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
                // Rayon du personnage : 1/6e de la hauteur d’un étage, par exemple
        // Ajuste ce ratio à ta convenance (0.1, 0.2, 0.3…)
        const characterRadius = 2*floorHeight**(1/2); 

        // Position X : on décale chaque personnage sur la même étage pour qu’ils ne se superposent pas
        // Ici, on part de 80, par exemple, et on recule de 40 pixels par personnage
        const baseX = 80; 
        const offsetX = characterRadius + 10; 
        const x = baseX - localIndex * offsetX;

        // Position Y : on vise le centre de l’étage (this.currentFloor + 0.5)
        // Ex.: pour l’étage i, la ligne du haut est à i * floorHeight, 
        // on veut la moitié (0.5) pour se mettre entre la ligne i et i+1
        const y = canvas.height - (this.currentFloor + 0.5) * floorHeight;




        ctx.beginPath();
        ctx.arc(x, y, characterRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff00d4";
        ctx.fill();

        // Épaisseur de contour
        const dynamicStroke = Math.min(8, Math.max(2, characterRadius * 0.2)+1);
        ctx.lineWidth = dynamicStroke;
        ctx.strokeStyle = "#fff";
        ctx.stroke();


        // Texte : destination floor
        // On adapte la taille de la police au rayon
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = `bold ${characterRadius * 1.4}px Arial`; 
        // Légèrement plus bas que le centre du cercle pour être visible
        ctx.fillText(this.destinationFloor, x, y + (characterRadius * 0.4)+1);
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
    console.log(
      `${selectedElevatorCount} ascenseur(s) initialisé(s) avec une capacité de ${config.capacity}`
    );

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
    updateScore();     // met à jour le score courant
    updateLevel();     // met à jour le niveau actuel

    // Récupérer la config courante
    const config = levelConfig[selectedElevatorCount][level];
    // Mettre à jour le div #scoreToPass avec la valeur de config.scoreToPass
    document.getElementById('scoreToPass').innerText = `Score à atteindre : ${config.scoreToPass}`;
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

    // Si on dépasse le nombre de niveaux config
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

    // On calcule une taille de police dynamique
    // Ici, on prend 30% de la hauteur d'un étage, 
    // mais en s'assurant que la taille ne dépasse pas 32px
    // ni ne descende en dessous de 8px, pour rester lisible.
    const labelFontSize = Math.min(32, Math.max(8, floorHeight * 0.3));

    // On compose la valeur de font
    ctx.font = `bold ${labelFontSize}px "Press Start 2P"`;
    ctx.textAlign = 'right';
    ctx.strokeStyle = "#888"; 
    ctx.lineWidth = 1;
    
    for (let i = 0; i < config.floors; i++) {
        const y = i * floorHeight;
        const canvasY = canvas.height - y;

        // Tracer la ligne de plancher
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();

        // Dessiner le numéro de l’étage
        ctx.fillStyle = "#00ffea";
        ctx.fillText(`${i}`, canvas.width - 10, canvasY - 5);
    }

    // Dessin des ascenseurs et des personnages
    elevators.forEach((elevator) => {
        elevator.draw();
    });
    characters.forEach((character) => {
        character.draw();
    });

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
    // Vérifier si clic sur un ascenseur
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

    // Si on n'a pas cliqué sur l'ascenseur, on détermine l'étage cliqué
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

    if (clickedElevator) {
        console.log(
          `Ascenseur ${clickedElevator.id + 1} sélectionné pour aller à l'étage ${targetFloor}`
        );
        clickedElevator.moveToFloor(targetFloor);
        drawBuilding();
    } else {
        console.log("Aucun ascenseur sélectionné. Cliquez sur une colonne d'ascenseur.");
    }
});

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

    drawBuilding();
    requestAnimationFrame(gameLoop);
    console.log("Jeu initialisé.");
}

window.onload = initGame;
