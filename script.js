window.onload = function(){

/* =========================
   ELEMENTOS
========================= */

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


/* =========================
   ESTADO DO JOGO
========================= */

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


/* =========================
   DIFICULDADE
========================= */

const difficultySpeed = {
    easy: 2,
    medium: 3,
    hard: 5
};


/* =========================
   EVENTOS
========================= */

easyBtn.addEventListener("click", () => startGame("easy"));
mediumBtn.addEventListener("click", () => startGame("medium"));
hardBtn.addEventListener("click", () => startGame("hard"));

restartBtn.addEventListener("click", restartGame);
victoryRestartBtn.addEventListener("click", restartGame);

// Botões de voltar ao menu
menuBtn.addEventListener("click", goToMenu);
menuFromGameOver.addEventListener("click", goToMenu);
menuFromVictory.addEventListener("click", goToMenu);


/* MOBILE */

document.querySelectorAll("[data-move]").forEach(btn => {
    btn.addEventListener("click", () => {
        movePlayer(btn.dataset.move);
    });
});


/* TECLADO */

document.addEventListener("keydown", (e) => {
    if (!game.running) return;
    if (e.key === "ArrowUp")    movePlayer("up");
    if (e.key === "ArrowDown")  movePlayer("down");
    if (e.key === "ArrowLeft")  movePlayer("left");
    if (e.key === "ArrowRight") movePlayer("right");
});


/* =========================
   INICIAR
========================= */

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


/* =========================
   TELAS
========================= */

function showScreen(type) {
    menu.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");

    if (type === "game")     gameScreen.classList.remove("hidden");
    if (type === "gameover") gameOverScreen.classList.remove("hidden");
    if (type === "victory")  victoryScreen.classList.remove("hidden");
    if (type === "menu")     menu.classList.remove("hidden");
}


/* =========================
   LOOP
========================= */

function gameLoop() {
    if (!game.running) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}


/* =========================
   UPDATE
========================= */

function update() {
    moveCars();
    if (game.phase >= 4) {
        moveLogs();
        checkWater();
    }
    checkCarCollision();
    checkVictory();
}


/* =========================
   DESENHO
========================= */

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
    let p = game.player;
    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.shadowBlur = 0;
}


/* =========================
   CARROS
========================= */

function createCars() {
    game.cars = [];
    let amount = 3 + game.phase;
    for (let i = 0; i < amount; i++) {
        game.cars.push({
            x: Math.random() * 500,
            y: 320 + (i % 4) * 45,
            width: 50,
            height: 25,
            speed: difficultySpeed[game.difficulty] + Math.random() * 2,
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
        if (car.x > 550) car.x = -60;
    });
}


/* =========================
   TRONCOS
========================= */

function createLogs() {
    game.logs = [];
    for (let i = 0; i < 4; i++) {
        game.logs.push({
            x: i * 120,
            y: 110 + (i % 2) * 60,
            width: 90,
            height: 25,
            speed: 2
        });
    }
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
        if (log.x > 520) log.x = -100;
    });
}


/* =========================
   PLAYER
========================= */

function resetPlayer() {
    game.player.x = 230;
    game.player.y = 600;
}

function movePlayer(direction) {
    let p = game.player;
    let s = p.step;
    if (direction === "up")    p.y -= s;
    if (direction === "down")  p.y += s;
    if (direction === "left")  p.x -= s;
    if (direction === "right") p.x += s;
    p.x = Math.max(0, Math.min(470, p.x));
    p.y = Math.max(0, Math.min(620, p.y));
}


/* =========================
   COLISÕES
========================= */

function checkCarCollision() {
    let p = game.player;
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
    let p = game.player;
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
                p.x += log.speed;
            }
        });
        if (!safe) loseLife();
    }
}


/* =========================
   VIDAS
========================= */

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


/* =========================
   FASES
========================= */

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
    if (game.phase >= 4) createLogs();
}


/* =========================
   HUD
========================= */

function updateHUD() {
    faseText.textContent = game.phase;
    vidasText.textContent = game.lives;
}

};
