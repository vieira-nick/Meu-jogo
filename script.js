window.onload = function(){

/* =========================
   ELEMENTOS
========================= */

const menu             = document.getElementById("menu");
const gameScreen       = document.getElementById("gameScreen");
const gameOverScreen   = document.getElementById("gameOver");
const victoryScreen    = document.getElementById("victory");

const easyBtn          = document.getElementById("easyBtn");
const mediumBtn        = document.getElementById("mediumBtn");
const hardBtn          = document.getElementById("hardBtn");

const restartBtn       = document.getElementById("restartBtn");
const victoryRestartBtn= document.getElementById("victoryRestartBtn");

const menuBtn          = document.getElementById("menuBtn");
const menuFromGameOver = document.getElementById("menuFromGameOver");
const menuFromVictory  = document.getElementById("menuFromVictory");

const faseText         = document.getElementById("fase");
const vidasText        = document.getElementById("vidas");

const canvas           = document.getElementById("gameCanvas");
const ctx              = canvas.getContext("2d");


/* =========================
   ESTADO DO JOGO
========================= */

const CANVAS_W  = 500;
const CANVAS_H  = 650;

// Zonas fixas (Y inicial → Y final, de cima para baixo)
const ZONA = {
    meta:    { y1:  0,  y2:  60 },   // chegou!
    grama1:  { y1: 60,  y2:  80 },   // faixa de segurança superior
    rio:     { y1: 80,  y2: 240 },   // água — 4 pistas de troncos
    grama2:  { y1: 240, y2: 290 },   // faixa de segurança do meio
    estrada: { y1: 290, y2: 510 },   // carros — 5 pistas
    calcada: { y1: 510, y2: 650 },   // início / calçada segura
};

// Pistas dos carros (centro Y de cada faixa dentro da estrada)
const CAR_LANES  = [310, 355, 400, 445, 490];
// Pistas dos troncos (centro Y de cada faixa dentro do rio)
const LOG_LANES  = [ 95, 135, 175, 215];

const game = {
    running:    false,
    difficulty: "easy",
    phase:      1,
    lives:      3,
    maxPhase:   7,
    // controle de morte: só mata 1× por "queda no rio"
    dyingCooldown: 0,
    player: {
        x: 230,
        y: 570,
        size: 28,
        step: 40,
        onLog: null   // referência ao tronco em que está
    },
    cars: [],
    logs: []
};


/* =========================
   DIFICULDADE
========================= */

// Velocidade base por dificuldade (bem mais suave)
const diffSpeed = { easy: 1.0, medium: 1.8, hard: 3.0 };


/* =========================
   EVENTOS
========================= */

easyBtn.addEventListener("click",   () => startGame("easy"));
mediumBtn.addEventListener("click", () => startGame("medium"));
hardBtn.addEventListener("click",   () => startGame("hard"));

restartBtn.addEventListener("click",        restartGame);
victoryRestartBtn.addEventListener("click", restartGame);

menuBtn.addEventListener("click",           goToMenu);
menuFromGameOver.addEventListener("click",  goToMenu);
menuFromVictory.addEventListener("click",   goToMenu);

document.querySelectorAll("[data-move]").forEach(btn => {
    btn.addEventListener("click", () => movePlayer(btn.dataset.move));
});

document.addEventListener("keydown", (e) => {
    if (!game.running) return;
    const map = {
        ArrowUp:"up", ArrowDown:"down",
        ArrowLeft:"left", ArrowRight:"right"
    };
    if (map[e.key]) { e.preventDefault(); movePlayer(map[e.key]); }
});


/* =========================
   INICIAR / REINICIAR
========================= */

function startGame(mode) {
    game.difficulty     = mode;
    game.phase          = 1;
    game.lives          = 3;
    game.running        = true;
    game.dyingCooldown  = 0;
    resetPlayer();
    createObjects();
    updateHUD();
    showScreen("game");
    requestAnimationFrame(gameLoop);
}

function restartGame() { startGame(game.difficulty); }

function goToMenu() {
    game.running = false;
    showScreen("menu");
}


/* =========================
   TELAS
========================= */

function showScreen(type) {
    [menu, gameScreen, gameOverScreen, victoryScreen]
        .forEach(s => s.classList.add("hidden"));

    ({ menu, game: gameScreen, gameover: gameOverScreen, victory: victoryScreen }
        [type]).classList.remove("hidden");
}


/* =========================
   LOOP PRINCIPAL
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
    // cooldown de morte (evita perder múltiplas vidas num frame)
    if (game.dyingCooldown > 0) game.dyingCooldown--;

    moveCars();

    if (hasRiver()) {
        moveLogs();
        applyLogMovement();   // carrega o player junto ao tronco
        checkWater();
    }

    checkCarCollision();
    checkVictory();
}


/* =========================
   CRIAÇÃO DE OBJETOS
========================= */

function hasRiver() { return game.phase >= 4; }

function createCars() {
    game.cars = [];
    // Número de carros cresce com a fase, máximo 5 por pista
    // Pistas aumentam gradualmente: fase 1→2, fase 3→3, fase 5→4, fase 7→5
    const laneCount = Math.min(CAR_LANES.length, 2 + Math.floor(game.phase / 2));
    for (let l = 0; l < laneCount; l++) {
        const carH   = 28;
        const laneY  = CAR_LANES[l] - carH / 2;
        // Variação aleatória pequena para não ser muito previsível
        const speed  = (diffSpeed[game.difficulty] + Math.random() * 0.6)
                       * (l % 2 === 0 ? 1 : -1);
        // Menos carros por pista — mais espaço para passar
        const count  = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            game.cars.push({
                x:      (CANVAS_W / count) * i + Math.random() * 40,
                y:      laneY,
                width:  55,
                height: carH,
                speed,
                color:  ["#ff006e","#8338ec","#ffbe0b","#fb5607","#3a86ff"][l % 5]
            });
        }
    }
}

function createLogs() {
    game.logs = [];
    // 4 pistas de troncos, direções alternadas, bem distribuídos
    LOG_LANES.forEach((laneY, i) => {
        const logH    = 28;
        const logW    = 130;          // troncos mais largos = mais fácil ficar em cima
        const gap     = 20;
        const speed   = (0.8 + i * 0.3) * (i % 2 === 0 ? 1 : -1);  // mais lentos
        const count   = 3;
        const spacing = (CANVAS_W + logW) / count;
        for (let j = 0; j < count; j++) {
            game.logs.push({
                x:      j * spacing,
                y:      laneY - logH / 2,
                width:  logW,
                height: logH,
                speed
            });
        }
    });
}

function createObjects() {
    createCars();
    if (hasRiver()) createLogs();
}


/* =========================
   MOVIMENTO
========================= */

function moveCars() {
    game.cars.forEach(car => {
        car.x += car.speed;
        if (car.speed > 0 && car.x > CANVAS_W + 10)  car.x = -car.width - 10;
        if (car.speed < 0 && car.x < -car.width - 10) car.x = CANVAS_W + 10;
    });
}

function moveLogs() {
    game.logs.forEach(log => {
        log.x += log.speed;
        if (log.speed > 0 && log.x > CANVAS_W + 10)   log.x = -log.width - 10;
        if (log.speed < 0 && log.x < -log.width - 10)  log.x = CANVAS_W + 10;
    });
}

// Se o player está em cima de um tronco, move junto
function applyLogMovement() {
    const p   = game.player;
    const log = getLogUnder();
    if (log) {
        p.x += log.speed;
        // Mantém dentro do canvas horizontalmente
        p.x = Math.max(0, Math.min(CANVAS_W - p.size, p.x));
    }
}


/* =========================
   PLAYER
========================= */

function resetPlayer() {
    game.player.x = 230;
    game.player.y = 570;
    game.player.onLog = null;
}

function movePlayer(dir) {
    if (!game.running) return;
    const p = game.player;
    const s = p.step;
    if (dir === "up")    p.y -= s;
    if (dir === "down")  p.y += s;
    if (dir === "left")  p.x -= s;
    if (dir === "right") p.x += s;
    p.x = Math.max(0, Math.min(CANVAS_W - p.size, p.x));
    p.y = Math.max(0, Math.min(CANVAS_H - p.size, p.y));
}


/* =========================
   COLISÕES
========================= */

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx &&
           ay < by + bh && ay + ah > by;
}

// Retorna o tronco sob o player (ou null)
function getLogUnder() {
    const p = game.player;
    return game.logs.find(log =>
        rectsOverlap(p.x, p.y, p.size, p.size,
                     log.x, log.y, log.width, log.height)
    ) || null;
}

function checkWater() {
    if (game.dyingCooldown > 0) return;
    const p = game.player;
    // Só verifica se o player está dentro da zona do rio
    if (p.y + p.size <= ZONA.rio.y1 || p.y >= ZONA.rio.y2) return;
    if (!getLogUnder()) loseLife();
}

function checkCarCollision() {
    if (game.dyingCooldown > 0) return;
    const p = game.player;
    for (const car of game.cars) {
        if (rectsOverlap(p.x, p.y, p.size, p.size,
                         car.x, car.y, car.width, car.height)) {
            loseLife();
            return;   // uma morte por frame basta
        }
    }
}

function checkVictory() {
    if (game.player.y + game.player.size <= ZONA.meta.y2) {
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


/* =========================
   VIDAS
========================= */

function loseLife() {
    game.lives--;
    game.dyingCooldown = 60;   // ~1 segundo de imunidade após morrer
    updateHUD();
    if (game.lives <= 0) {
        game.running = false;
        showScreen("gameover");
        return;
    }
    resetPlayer();
}


/* =========================
   HUD
========================= */

function updateHUD() {
    faseText.textContent  = game.phase;
    vidasText.textContent = "❤️".repeat(Math.max(0, game.lives));
}


/* =========================
   DESENHO
========================= */

function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground();
    if (hasRiver()) { drawRiver(); drawLogs(); }
    drawGrassStrips();
    drawRoad();
    drawCars();
    drawPlayer();
    drawZoneLabels();
}

function drawBackground() {
    ctx.fillStyle = "#05131f";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = "rgba(0,247,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_H; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_W, i); ctx.stroke();
    }
}

function drawGrassStrips() {
    ctx.fillStyle = "#1a4d2e";
    // faixa superior (entre rio e meta)
    ctx.fillRect(0, ZONA.grama1.y1, CANVAS_W, ZONA.grama1.y2 - ZONA.grama1.y1);
    // faixa do meio (entre rio e estrada)
    ctx.fillRect(0, ZONA.grama2.y1, CANVAS_W, ZONA.grama2.y2 - ZONA.grama2.y1);
    // calçada inferior
    ctx.fillStyle = "#2d4a22";
    ctx.fillRect(0, ZONA.calcada.y1, CANVAS_W, ZONA.calcada.y2 - ZONA.calcada.y1);
}

function drawRiver() {
    ctx.fillStyle = "#003566";
    ctx.fillRect(0, ZONA.rio.y1, CANVAS_W, ZONA.rio.y2 - ZONA.rio.y1);
    // ondas decorativas
    ctx.strokeStyle = "rgba(0,100,200,0.4)";
    ctx.lineWidth = 2;
    for (let y = ZONA.rio.y1 + 20; y < ZONA.rio.y2; y += 40) {
        ctx.beginPath();
        for (let x = 0; x < CANVAS_W; x += 20) {
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 10, y - 5, x + 20, y);
        }
        ctx.stroke();
    }
}

function drawRoad() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, ZONA.estrada.y1, CANVAS_W, ZONA.estrada.y2 - ZONA.estrada.y1);
    // faixas tracejadas
    ctx.setLineDash([20, 15]);
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    CAR_LANES.slice(0, -1).forEach(laneY => {
        const y = laneY + 14;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    });
    ctx.setLineDash([]);
}

function drawLogs() {
    game.logs.forEach(log => {
        // corpo do tronco
        ctx.fillStyle = "#7c4a1e";
        ctx.beginPath();
        ctx.roundRect(log.x, log.y, log.width, log.height, 6);
        ctx.fill();
        // veios de madeira
        ctx.strokeStyle = "#9c6644";
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            const lx = log.x + (log.width / 4) * i;
            ctx.beginPath();
            ctx.moveTo(lx, log.y + 3);
            ctx.lineTo(lx, log.y + log.height - 3);
            ctx.stroke();
        }
    });
}

function drawCars() {
    game.cars.forEach(car => {
        // carroceria
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(car.x, car.y, car.width, car.height, 5);
        ctx.fill();
        // janelas
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(car.x + 8,  car.y + 5, 15, 10);
        ctx.fillRect(car.x + 30, car.y + 5, 15, 10);
    });
}

function drawPlayer() {
    const p = game.player;
    // Pisca durante cooldown de morte
    if (game.dyingCooldown > 0 && Math.floor(game.dyingCooldown / 6) % 2 === 0) return;

    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = "#00ff88";
    // corpo do sapo
    ctx.beginPath();
    ctx.roundRect(p.x + 2, p.y + 6, p.size - 4, p.size - 6, 8);
    ctx.fill();
    // cabeça
    ctx.beginPath();
    ctx.roundRect(p.x + 4, p.y, p.size - 8, 14, 6);
    ctx.fill();
    // olhos
    ctx.fillStyle   = "#000";
    ctx.shadowBlur  = 0;
    ctx.beginPath(); ctx.arc(p.x + 7,  p.y + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + 21, p.y + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
}

function drawZoneLabels() {
    // Indicador sutil da meta
    ctx.fillStyle = "rgba(0,255,136,0.15)";
    ctx.fillRect(0, 0, CANVAS_W, ZONA.meta.y2);
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("▲ META ▲", CANVAS_W / 2, 40);
    ctx.textAlign = "left";
}

};
