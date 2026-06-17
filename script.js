window.onload = function(){

/* =========================
   ELEMENTOS
========================= */

const menu             = document.getElementById("menu");
const gameScreen       = document.getElementById("gameScreen");
const gameOverScreen   = document.getElementById("gameOver");
const victoryScreen    = document.getElementById("victory");

const playBtn          = document.getElementById("playBtn");
const restartBtn       = document.getElementById("restartBtn");
const victoryRestartBtn= document.getElementById("victoryRestartBtn");

const menuBtn          = document.getElementById("menuBtn");
const menuFromGameOver = document.getElementById("menuFromGameOver");
const menuFromVictory  = document.getElementById("menuFromVictory");

const faseText         = document.getElementById("fase");
const vidasText        = document.getElementById("vidas");
const scoreText        = document.getElementById("score");

const canvas           = document.getElementById("gameCanvas");
const ctx              = canvas.getContext("2d");

/* =========================
   ESCALA RESPONSIVA DO CANVAS
   Internamente o canvas é sempre 500x650.
   Calculamos o maior tamanho visual que cabe na tela
   deixando espaço para HUD + controles mobile.
========================= */
function resizeCanvas() {
    const reservedH = 240; // HUD + controles + margens
    const reservedW = 24;
    const maxW = window.innerWidth  - reservedW;
    const maxH = window.innerHeight - reservedH;
    const scale = Math.min(maxW / 500, maxH / 650, 1);
    const dispW = Math.floor(500 * scale);
    const dispH = Math.floor(650 * scale);
    document.documentElement.style.setProperty("--canvas-display-w", dispW + "px");
    document.documentElement.style.setProperty("--canvas-display-h", dispH + "px");
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 300));


/* =========================
   CONSTANTES DE LAYOUT
========================= */

const CANVAS_W = 500;
const CANVAS_H = 650;

const ZONA = {
    meta:    { y1:  0,  y2:  60 },
    grama1:  { y1: 60,  y2:  80 },
    rio:     { y1: 80,  y2: 240 },
    grama2:  { y1: 240, y2: 290 },
    estrada: { y1: 290, y2: 510 },
    calcada: { y1: 510, y2: 650 },
};

const CAR_LANES = [310, 355, 400, 445, 490];
const LOG_LANES = [ 95, 135, 175, 215];


/* =========================
   ESTADO DO JOGO
========================= */

const game = {
    running:       false,
    phase:         1,
    lives:         3,
    maxPhase:      7,
    score:         0,
    highScore:     0,
    dyingCooldown: 0,
    phaseTimer:    0,
    tick:          0,
    player: {
        x: 230, y: 570,
        size: 28, step: 40,
        lastDir: "up",
        jumping: 0,
    },
    cars: [],
    logs: [],
    particles: [],
};

// Velocidade base cresce suavemente a cada fase
function baseSpeed() {
    return 1.0 + (game.phase - 1) * 0.12;
}


/* =========================
   EVENTOS
========================= */

playBtn.addEventListener("click", () => startGame());

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
    const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right" };
    if (map[e.key]) { e.preventDefault(); movePlayer(map[e.key]); }
});


/* =========================
   INICIAR / REINICIAR
========================= */

let loopId = null;

function startGame() {
    // Para qualquer loop anterior antes de iniciar
    game.running = false;
    if (loopId) { cancelAnimationFrame(loopId); loopId = null; }

    game.phase         = 1;
    game.lives         = 3;
    game.score         = 0;
    game.tick          = 0;
    game.dyingCooldown = 0;
    game.phaseTimer    = 0;
    game.particles     = [];
    game.running       = true;
    resetPlayer();
    createObjects();
    updateHUD();
    showScreen("game");
    loopId = requestAnimationFrame(gameLoop);
}

function restartGame() { startGame(); }

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

    if (type === "menu")     menu.classList.remove("hidden");
    if (type === "game")     gameScreen.classList.remove("hidden");
    if (type === "gameover") gameOverScreen.classList.remove("hidden");
    if (type === "victory")  victoryScreen.classList.remove("hidden");
}


/* =========================
   LOOP PRINCIPAL
========================= */

function gameLoop() {
    if (!game.running) { loopId = null; return; }
    update();
    draw();
    loopId = requestAnimationFrame(gameLoop);
}


/* =========================
   UPDATE
========================= */

function update() {
    if (game.dyingCooldown > 0) game.dyingCooldown--;
    game.phaseTimer++;
    game.tick++;
    if (game.player.jumping > 0) game.player.jumping--;

    moveCars();

    if (hasRiver()) {
        moveLogs();
        applyLogMovement();
        checkWater();
    }

    checkCarCollision();
    checkVictory();
    updateParticles();
}


/* =========================
   CRIAÇÃO DE OBJETOS
========================= */

function hasRiver() { return game.phase >= 4; }

function createCars() {
    game.cars = [];
    const laneCount = Math.min(CAR_LANES.length, 2 + Math.floor(game.phase / 2));
    for (let l = 0; l < laneCount; l++) {
        const carH  = 28;
        const laneY = CAR_LANES[l] - carH / 2;
        const speed = (baseSpeed() + Math.random() * 0.5) * (l % 2 === 0 ? 1 : -1);
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            game.cars.push({
                x:      (CANVAS_W / count) * i + Math.random() * 30,
                y:      laneY,
                width:  55,
                height: carH,
                speed,
                color: ["#ff006e","#8338ec","#ffbe0b","#fb5607","#3a86ff"][l % 5]
            });
        }
    }
}

function createLogs() {
    game.logs = [];
    LOG_LANES.forEach((laneY, i) => {
        const logH    = 28;
        const logW    = 130;
        const speed   = (0.8 + i * 0.25) * (i % 2 === 0 ? 1 : -1);
        const count   = 3;
        const spacing = (CANVAS_W + logW) / count;
        for (let j = 0; j < count; j++) {
            game.logs.push({
                x: j * spacing, y: laneY - logH / 2,
                width: logW, height: logH, speed
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
        if (car.speed > 0 && car.x >  CANVAS_W + 10) car.x = -car.width - 10;
        if (car.speed < 0 && car.x < -car.width - 10) car.x = CANVAS_W + 10;
    });
}

function moveLogs() {
    game.logs.forEach(log => {
        log.x += log.speed;
        if (log.speed > 0 && log.x >  CANVAS_W + 10)  log.x = -log.width - 10;
        if (log.speed < 0 && log.x < -log.width - 10)  log.x = CANVAS_W + 10;
    });
}

function applyLogMovement() {
    const p   = game.player;
    const log = getLogUnder();
    if (log) {
        p.x += log.speed;
        p.x = Math.max(0, Math.min(CANVAS_W - p.size, p.x));
    }
}


/* =========================
   PLAYER
========================= */

function resetPlayer() {
    game.player.x = 230;
    game.player.y = 570;
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
    p.lastDir = dir;
    p.jumping = 10; // frames de animação de salto
}


/* =========================
   COLISÕES
========================= */

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function getLogUnder() {
    const p = game.player;
    return game.logs.find(log =>
        rectsOverlap(p.x, p.y, p.size, p.size, log.x, log.y, log.width, log.height)
    ) || null;
}

function checkWater() {
    if (game.dyingCooldown > 0) return;
    const p = game.player;
    if (p.y + p.size <= ZONA.rio.y1 || p.y >= ZONA.rio.y2) return;
    if (!getLogUnder()) loseLife();
}

function checkCarCollision() {
    if (game.dyingCooldown > 0) return;
    const p = game.player;
    for (const car of game.cars) {
        if (rectsOverlap(p.x, p.y, p.size, p.size, car.x, car.y, car.width, car.height)) {
            loseLife();
            return;
        }
    }
}

function checkVictory() {
    if (game.player.y + game.player.size <= ZONA.meta.y2) {
        // Bônus de velocidade: quanto mais rápido atravessou, mais pontos
        const speedBonus = Math.max(0, 300 - game.phaseTimer);
        game.score += 100 + game.phase * 10 + speedBonus;
        game.phaseTimer = 0;
        game.phase++;

        if (game.phase > game.maxPhase) {
            game.running = false;
            if (game.score > game.highScore) game.highScore = game.score;
            document.getElementById("finalScore").textContent    = game.score;
            document.getElementById("finalHighScore").textContent = game.highScore;
            showScreen("victory");
            return;
        }
        spawnParticles(game.player.x + game.player.size/2, game.player.y, "#00ff88", 14);
        createObjects();
        resetPlayer();
        updateHUD();
    }
}


/* =========================
   VIDAS
========================= */

function loseLife() {
    spawnParticles(game.player.x + game.player.size/2, game.player.y + game.player.size/2, "#ff006e", 16);
    game.lives--;
    game.dyingCooldown = 80;
    updateHUD();
    if (game.lives <= 0) {
        game.running = false;
        if (game.score > game.highScore) game.highScore = game.score;
        document.getElementById("finalScoreOver").textContent    = game.score;
        document.getElementById("finalHighScoreOver").textContent = game.highScore;
        showScreen("gameover");
        return;
    }
    resetPlayer();
}


/* =========================
   PARTÍCULAS
========================= */

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        game.particles.push({
            x, y,
            vx: Math.cos(angle) * (2 + Math.random() * 3),
            vy: Math.sin(angle) * (2 + Math.random() * 3),
            alpha: 1, color,
            r: 4 + Math.random() * 3
        });
    }
}

function updateParticles() {
    game.particles = game.particles.filter(p => p.alpha > 0.05);
    game.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= 0.035;
        p.r *= 0.96;
    });
}

function drawParticles() {
    game.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}


/* =========================
   HUD
========================= */

function updateHUD() {
    faseText.textContent  = game.phase + " / " + game.maxPhase;
    vidasText.textContent = "❤️".repeat(Math.max(0, game.lives));
    scoreText.textContent = game.score;
}


/* =========================
   DESENHO
========================= */

function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground();
    drawCalcada();
    drawGrassStrips();
    if (hasRiver()) { drawRiver(); drawLogs(); }
    drawRoad();
    drawCars();
    drawParticles();
    drawPlayer();
    drawMeta();
}

/* --- Fundo com grade neon sutil --- */
function drawBackground() {
    ctx.fillStyle = "#050c18";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

/* --- Calçada inicial com tijolos --- */
function drawCalcada() {
    const y1 = ZONA.calcada.y1, h = ZONA.calcada.y2 - y1;
    ctx.fillStyle = "#1c2a1c";
    ctx.fillRect(0, y1, CANVAS_W, h);
    // linhas de "bloco"
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let y = y1; y < ZONA.calcada.y2; y += 18) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
    for (let x = 0; x < CANVAS_W; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, ZONA.calcada.y2); ctx.stroke();
    }
    // borda superior luminosa
    ctx.strokeStyle = "rgba(0,255,100,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(CANVAS_W, y1); ctx.stroke();
}

/* --- Faixas de grama com detalhes --- */
function drawGrassStrips() {
    [[ZONA.grama1], [ZONA.grama2]].forEach(([z]) => {
        const h = z.y2 - z.y1;
        // base
        ctx.fillStyle = "#1e5c32";
        ctx.fillRect(0, z.y1, CANVAS_W, h);
        // listras claras
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        for (let x = 0; x < CANVAS_W; x += 12) {
            ctx.fillRect(x, z.y1, 6, h);
        }
        // bordas
        ctx.strokeStyle = "rgba(80,200,80,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, z.y1); ctx.lineTo(CANVAS_W, z.y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, z.y2 - 1); ctx.lineTo(CANVAS_W, z.y2 - 1); ctx.stroke();
    });
}

/* --- Rio com ondas animadas --- */
function drawRiver() {
    const ry1 = ZONA.rio.y1, rh = ZONA.rio.y2 - ry1;
    const t = game.tick;

    // base do rio: gradiente vertical
    const grad = ctx.createLinearGradient(0, ry1, 0, ZONA.rio.y2);
    grad.addColorStop(0,   "#001a40");
    grad.addColorStop(0.5, "#002e6a");
    grad.addColorStop(1,   "#001a40");
    ctx.fillStyle = grad;
    ctx.fillRect(0, ry1, CANVAS_W, rh);

    // reflexo de luz lateral animado
    ctx.fillStyle = "rgba(0,100,255,0.06)";
    const refX = ((t * 0.4) % (CANVAS_W + 60)) - 30;
    ctx.fillRect(refX, ry1, 40, rh);

    // ondas em 3 camadas com offset de fase
    const waveRows = [
        { yOff: 18, amp: 3.5, freq: 0.025, speed: 0.04, alpha: 0.5,  width: 2.5 },
        { yOff: 38, amp: 2.5, freq: 0.030, speed: 0.06, alpha: 0.35, width: 1.5 },
        { yOff: 58, amp: 4,   freq: 0.020, speed: 0.03, alpha: 0.25, width: 2   },
    ];
    for (let row = 0; row < 4; row++) {          // 4 faixas do rio
        const baseY = ry1 + row * 40;
        waveRows.forEach(w => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100,180,255,${w.alpha})`;
            ctx.lineWidth = w.width;
            for (let x = 0; x <= CANVAS_W; x += 3) {
                const y = baseY + w.yOff + Math.sin(x * w.freq + t * w.speed + row) * w.amp;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        });
    }

    // brilho superficial (sparkles)
    ctx.fillStyle = "rgba(180,230,255,0.55)";
    for (let i = 0; i < 8; i++) {
        const sx = ((t * (0.5 + i * 0.3) + i * 80) % CANVAS_W);
        const sy = ry1 + 10 + (i * 29) % rh;
        const sr = 1.5 + Math.sin(t * 0.1 + i) * 0.8;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
}

/* --- Estrada com asfalto e detalhes --- */
function drawRoad() {
    const ry1 = ZONA.estrada.y1, rh = ZONA.estrada.y2 - ry1;

    // asfalto escuro com leve granulado
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, ry1, CANVAS_W, rh);

    // textura granular sutil
    ctx.fillStyle = "rgba(255,255,255,0.018)";
    for (let i = 0; i < 120; i++) {
        // posições determinísticas (evita shimmer a cada frame)
        const gx = (i * 37) % CANVAS_W;
        const gy = ry1 + (i * 53) % rh;
        ctx.fillRect(gx, gy, 2, 2);
    }

    // bordas da estrada
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(0, ry1 + 1); ctx.lineTo(CANVAS_W, ry1 + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, ZONA.estrada.y2 - 1); ctx.lineTo(CANVAS_W, ZONA.estrada.y2 - 1); ctx.stroke();

    // faixas tracejadas entre pistas — animadas (deslizam)
    const dashOffset = (game.tick * 1.5) % 35;
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = "rgba(255,255,200,0.22)";
    ctx.lineWidth = 2;
    CAR_LANES.slice(0, -1).forEach(laneY => {
        const y = laneY + 14;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
}

/* --- Troncos com textura de madeira detalhada --- */
function drawLogs() {
    game.logs.forEach(log => {
        const { x, y, width: w, height: h } = log;

        // sombra do tronco na água
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h + 4, w/2 - 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // corpo principal com gradiente de madeira
        const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
        woodGrad.addColorStop(0,   "#a0622a");
        woodGrad.addColorStop(0.3, "#7c4a1e");
        woodGrad.addColorStop(0.7, "#6b3d14");
        woodGrad.addColorStop(1,   "#8a5220");
        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();

        // veios de madeira longitudinais
        ctx.strokeStyle = "rgba(60,30,10,0.5)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const ly = y + 5 + i * (h / 3.5);
            ctx.beginPath();
            ctx.moveTo(x + 4, ly);
            ctx.bezierCurveTo(x + w*0.3, ly - 1.5, x + w*0.7, ly + 1.5, x + w - 4, ly);
            ctx.stroke();
        }

        // anéis nas extremidades do tronco
        ["#c47a3a", "#9c5c28"].forEach((col, ci) => {
            const ex = ci === 0 ? x + 5 : x + w - 5;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(ex, y + h/2, 3, h/2 - 2, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(ex, y + h/2, 1.5, h/2 - 4, 0, 0, Math.PI * 2); ctx.stroke();
        });

        // borda superior clara (reflexo)
        ctx.strokeStyle = "rgba(255,200,120,0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 2); ctx.lineTo(x + w - 6, y + 2);
        ctx.stroke();
    });
}

/* --- Carros detalhados com faróis e para-brisas --- */
function drawCars() {
    game.cars.forEach(car => {
        const { x, y, width: w, height: h, color, speed } = car;
        const goRight = speed > 0;

        // sombra no chão
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h + 3, w/2 - 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // carroceria principal
        ctx.shadowColor = color;
        ctx.shadowBlur  = 10;
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
        bodyGrad.addColorStop(0,   lightenColor(color, 40));
        bodyGrad.addColorStop(0.4, color);
        bodyGrad.addColorStop(1,   darkenColor(color, 40));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill();
        ctx.shadowBlur = 0;

        // teto / cabine elevada
        ctx.fillStyle = darkenColor(color, 20);
        ctx.beginPath(); ctx.roundRect(x + 10, y - 7, w - 20, 10, [4, 4, 0, 0]); ctx.fill();

        // para-brisas (frente e traseiro)
        ctx.fillStyle = "rgba(150,220,255,0.35)";
        if (goRight) {
            ctx.beginPath(); ctx.roundRect(x + w - 20, y - 6, 14, 9, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(x + 6,       y - 6, 10, 9, 2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.roundRect(x + 6,       y - 6, 14, 9, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(x + w - 16,  y - 6, 10, 9, 2); ctx.fill();
        }

        // rodas
        [x + 7, x + w - 13].forEach(wx => {
            ctx.fillStyle = "#111";
            ctx.beginPath(); ctx.ellipse(wx, y + h - 1, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#555";
            ctx.beginPath(); ctx.ellipse(wx, y + h - 1, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
        });

        // faróis dianteiros com brilho
        const headX = goRight ? x + w - 4 : x + 2;
        ctx.fillStyle = "#fffbe0";
        ctx.shadowColor = "#fffbe0";
        ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.ellipse(headX, y + 5,  3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(headX, y + h - 5, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();

        // lanternas traseiras vermelhas
        const tailX = goRight ? x + 2 : x + w - 2;
        ctx.fillStyle = "#ff2222";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(tailX, y + 5,  2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(tailX, y + h - 5, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });
}

/* --- Sapo detalhado com animação de salto --- */
function drawPlayer() {
    const p = game.player;
    if (game.dyingCooldown > 0 && Math.floor(game.dyingCooldown / 5) % 2 === 0) return;

    ctx.save();

    // squish/stretch durante o salto
    const jumping = p.jumping > 0;
    const squishX = jumping ? 0.82 : 1;
    const squishY = jumping ? 1.22 : 1;
    const cx = p.x + p.size / 2;
    const cy = p.y + p.size / 2;

    ctx.translate(cx, cy);

    // rotação baseada na direção
    const rotMap = { up: 0, down: Math.PI, left: -Math.PI/2, right: Math.PI/2 };
    ctx.rotate(rotMap[p.lastDir] || 0);
    ctx.scale(squishX, squishY);
    ctx.translate(-cx, -cy);

    const px = p.x, py = p.y, ps = p.size;

    // sombra no chão
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(px + ps/2, py + ps + 3, ps/2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // patas traseiras (embaixo)
    ctx.fillStyle = "#00cc66";
    // pata esquerda
    ctx.beginPath();
    ctx.ellipse(px - 3, py + ps - 6, 6, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    // pata direita
    ctx.beginPath();
    ctx.ellipse(px + ps + 3, py + ps - 6, 6, 4, 0.4, 0, Math.PI * 2); ctx.fill();

    // dedos das patas traseiras
    ctx.fillStyle = "#009944";
    [-5, -2, 1].forEach(d => {
        ctx.beginPath(); ctx.ellipse(px - 7 + d, py + ps - 4, 2, 1.5, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + ps + 5 + d, py + ps - 4, 2, 1.5, 0.6, 0, Math.PI * 2); ctx.fill();
    });

    // corpo principal com gradiente
    const bodyGrad = ctx.createRadialGradient(px + ps/2, py + ps*0.55, 2, px + ps/2, py + ps*0.6, ps*0.6);
    bodyGrad.addColorStop(0,   "#22ff88");
    bodyGrad.addColorStop(0.6, "#00cc55");
    bodyGrad.addColorStop(1,   "#007733");
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.roundRect(px + 1, py + ps*0.38, ps - 2, ps*0.62, [4, 4, 8, 8]);
    ctx.fill();
    ctx.shadowBlur = 0;

    // barriga mais clara
    ctx.fillStyle = "rgba(200,255,210,0.22)";
    ctx.beginPath();
    ctx.ellipse(px + ps/2, py + ps*0.68, ps*0.28, ps*0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // cabeça
    const headGrad = ctx.createRadialGradient(px + ps/2, py + 8, 1, px + ps/2, py + 10, 12);
    headGrad.addColorStop(0,   "#33ff99");
    headGrad.addColorStop(1,   "#00aa44");
    ctx.fillStyle = headGrad;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.roundRect(px + 3, py, ps - 6, ps * 0.45, [8, 8, 4, 4]);
    ctx.fill();
    ctx.shadowBlur = 0;

    // patas dianteiras
    ctx.fillStyle = "#00cc55";
    ctx.beginPath(); ctx.ellipse(px + 2,      py + ps*0.4, 4, 3, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + ps - 2, py + ps*0.4, 4, 3,  0.5, 0, Math.PI * 2); ctx.fill();

    // olhos salientes
    [[px + 7, py + 5], [px + ps - 7, py + 5]].forEach(([ex, ey]) => {
        // globo ocular
        ctx.fillStyle = "#00ee66";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // pupila
        ctx.fillStyle = "#001a00";
        ctx.beginPath(); ctx.arc(ex + 1, ey + 1, 2.5, 0, Math.PI * 2); ctx.fill();
        // brilho
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath(); ctx.arc(ex + 2, ey - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    });

    // narinas
    ctx.fillStyle = "#005522";
    ctx.beginPath(); ctx.arc(px + 9,      py + 12, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + ps - 9, py + 12, 1.2, 0, Math.PI * 2); ctx.fill();

    // sorriso
    ctx.strokeStyle = "#005522";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px + ps/2, py + 11, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
}

/* --- Zona da meta pulsante --- */
function drawMeta() {
    const pulse = 0.08 + Math.abs(Math.sin(game.tick * 0.05)) * 0.08;
    ctx.fillStyle = `rgba(0,255,136,${pulse})`;
    ctx.fillRect(0, 0, CANVAS_W, ZONA.meta.y2);

    // linha pulsante
    ctx.strokeStyle = `rgba(0,255,136,${0.4 + Math.sin(game.tick * 0.08) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(0, ZONA.meta.y2); ctx.lineTo(CANVAS_W, ZONA.meta.y2); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(0,255,136,${0.7 + Math.sin(game.tick * 0.1) * 0.3})`;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("▲  M E T A  ▲", CANVAS_W / 2, 38);
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";
}

/* --- Helpers de cor --- */
function lightenColor(hex, amt) {
    const n = parseInt(hex.replace("#",""), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
}
function darkenColor(hex, amt) {
    const n = parseInt(hex.replace("#",""), 16);
    const r = Math.max(0, (n >> 16) - amt);
    const g = Math.max(0, ((n >> 8) & 0xff) - amt);
    const b = Math.max(0, (n & 0xff) - amt);
    return `rgb(${r},${g},${b})`;
}

};
