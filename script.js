```javascript
window.onload = function () {

const menu = document.getElementById("menu");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOver");
const victoryScreen = document.getElementById("victory");

const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");

const restartBtn = document.getElementById("restartBtn");
const victoryRestartBtn = document.getElementById("victoryRestartBtn");

const menuBtn = document.getElementById("menuBtn");
const menuFromGameOver = document.getElementById("menuFromGameOver");
const menuFromVictory = document.getElementById("menuFromVictory");

const faseText = document.getElementById("fase");
const vidasText = document.getElementById("vidas");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


/* ================= GAME STATE ================= */

const game = {
    running: false,
    difficulty: "easy",
    phase: 1,
    lives: 3,
    maxPhase: 7,

    player: {
        x: 230,
        y: 600,
        size: 28,
        step: 40
    },

    cars: [],
    logs: []
};


/* ================= DIFFICULTY ================= */

const difficultySpeed = {
    easy: 1.8,
    medium: 2.7,
    hard: 3.8
};


/* ================= EVENTS ================= */

easyBtn.addEventListener("click", () => startGame("easy"));
mediumBtn.addEventListener("click", () => startGame("medium"));
hardBtn.addEventListener("click", () => startGame("hard"));

restartBtn.addEventListener("click", restartGame);
victoryRestartBtn.addEventListener("click", restartGame);

menuBtn.addEventListener("click", goToMenu);
menuFromGameOver.addEventListener("click", goToMenu);
menuFromVictory.addEventListener("click", goToMenu);

document.querySelectorAll("[data-move]").forEach(btn => {
    btn.addEventListener("click", () => {
        movePlayer(btn.dataset.move);
    });
});

document.addEventListener("keydown", (e) => {
    if (!game.running) return;

    if (e.key === "ArrowUp") movePlayer("up");
    if (e.key === "ArrowDown") movePlayer("down");
    if (e.key === "ArrowLeft") movePlayer("left");
    if (e.key === "ArrowRight") movePlayer("right");
});


/* ================= GAME START ================= */

function startGame(mode) {
    game.difficulty = mode;
    game.phase = 1;
    game.lives = 3;
    game.running = true;

    resetPlayer();
    createObjects();
    updateHUD();

    showScreen("game");
    gameLoop();
}

function restartGame() {
    startGame(game.difficulty);
}

function goToMenu() {
    game.running = false;
    showScreen("menu");
}


/* ================= SCREENS ================= */

function showScreen(type) {

    menu.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");

    if (type === "game") gameScreen.classList.remove("hidden");
    if (type === "gameover") gameOverScreen.classList.remove("hidden");
    if (type === "victory") victoryScreen.classList.remove("hidden");
    if (type === "menu") menu.classList.remove("hidden");
}


/* ================= LOOP ================= */

function gameLoop() {
    if (!game.running) return;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}


/* ================= UPDATE ================= */

function update() {

    moveCars();

    if (game.phase >= 4) {
        moveLogs();
        checkWater();
    }

    checkCarCollision();
    checkVictory();
}


/* ================= DRAW ================= */

function draw() {
    ctx.clearRect(0, 0, 500, 650);

    drawBackground();

    if (game.phase >= 4) {
        drawRiver();
        drawLogs();
    }

    drawRoad();
    drawCars();
    drawPlayer();
}

function drawBackground() {
    ctx.fillStyle = "#05131f";
    ctx.fillRect(0, 0, 500, 650);

    ctx.strokeStyle = "#00f7ff";

    for (let i = 0; i < 650; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(500, i);
        ctx.stroke();
    }
}

function drawRoad() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 290, 500, 220);
}

function drawRiver() {
    ctx.fillStyle = "#003566";
    ctx.fillRect(0, 80, 500, 150);
}

function drawPlayer() {
    const p = game.player;

    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;

    ctx.fillRect(p.x, p.y, p.size, p.size);

    ctx.shadowBlur = 0;
}


/* ================= CARS ================= */

function createCars() {

    game.cars = [];

    let amount = 3 + game.phase;

    for (let i = 0; i < amount; i++) {

        game.cars.push({

            x: Math.random() * 500,
            y: 320 + (i % 4) * 45,

            width: 50,
            height: 25,

            speed: difficultySpeed[game.difficulty] + Math.random() * 1.5,

            color: ["#ff006e", "#8338ec", "#ffbe0b"][i % 3]
        });
    }
}

function drawCars() {

    game.cars.forEach(car => {

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);

    });
}

function moveCars() {

    game.cars.forEach(car => {

        car.x += car.speed;

        if (car.x > 550) {
            car.x = -60;
        }

    });
}


/* ================= LOGS ================= */

function createLogs() {

    game.logs = [];

    const patterns = [

        { x: 0,   y: 95,  speed: 1.2 },
        { x: 180, y: 95,  speed: 1.2 },
        { x: 360, y: 95,  speed: 1.2 },

        { x: 60,  y: 145, speed: -1.5 },
        { x: 260, y: 145, speed: -1.5 },

        { x: 20,  y: 195, speed: 1.8 },
        { x: 220, y: 195, speed: 1.8 },
        { x: 420, y: 195, speed: 1.8 }

    ];

    patterns.forEach(log => {

        game.logs.push({

            x: log.x,
            y: log.y,

            width: 110,
            height: 25,

            speed: log.speed
        });

    });
}

function drawLogs() {

    game.logs.forEach(log => {

        ctx.fillStyle = "#9c6644";
        ctx.fillRect(log.x, log.y, log.width, log.height);

    });
}

function moveLogs() {

    game.logs.forEach(log => {

        log.x += log.speed;

        if (log.speed > 0 && log.x > 520) {
            log.x = -120;
        }

        if (log.speed < 0 && log.x < -120) {
            log.x = 520;
        }

    });
}


/* ================= PLAYER ================= */

function resetPlayer() {
    game.player.x = 230;
    game.player.y = 600;
}

function movePlayer(direction) {

    const p = game.player;

    if (direction === "up") p.y -= p.step;
    if (direction === "down") p.y += p.step;
    if (direction === "left") p.x -= p.step;
    if (direction === "right") p.x += p.step;

    p.x = Math.max(0, Math.min(470, p.x));
    p.y = Math.max(0, Math.min(620, p.y));
}


/* ================= COLLISION ================= */

function checkCarCollision() {

    const p = game.player;

    game.cars.forEach(car => {

        if (
            p.x < car.x + car.width &&
            p.x + p.size > car.x &&
            p.y < car.y + car.height &&
            p.y + p.size > car.y
        ) {
            loseLife();
        }

    });
}

function checkWater() {

    const p = game.player;

    if (p.y > 80 && p.y < 230) {

        let safe = false;

        game.logs.forEach(log => {

            if (
                p.x < log.x + log.width &&
                p.x + p.size > log.x &&
                p.y < log.y + log.height &&
                p.y + p.size > log.y
            ) {
                safe = true;

                // acompanha o tronco
                p.x += log.speed;
            }

        });

        if (!safe) {
            loseLife();
        }

        p.x = Math.max(0, Math.min(470, p.x));
    }
}


/* ================= LIFE ================= */

function loseLife() {

    game.lives--;

    updateHUD();

    if (game.lives <= 0) {

        game.running = false;
        showScreen("gameover");

        return;
    }

    resetPlayer();
}


/* ================= PHASE ================= */

function checkVictory() {

    if (game.player.y <= 20) {

        game.phase++;

        if (game.phase > game.maxPhase) {

            game.running = false;
            showScreen("victory");

            return;
        }

        createObjects();
        resetPlayer();
        updateHUD();
    }
}

function createObjects() {

    createCars();

    if (game.phase >= 4) {
        createLogs();
    }
}


/* ================= HUD ================= */

function updateHUD() {

    faseText.textContent = game.phase;
    vidasText.textContent = game.lives;
}

};
```
