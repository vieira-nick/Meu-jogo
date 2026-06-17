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
   ESCALA RESPONSIVA
========================= */
function resizeCanvas() {
    const maxW  = window.innerWidth  - 24;
    const maxH  = window.innerHeight - 240;
    const scale = Math.min(maxW / 500, maxH / 650, 1);
    document.documentElement.style.setProperty("--canvas-display-w", Math.floor(500 * scale) + "px");
    document.documentElement.style.setProperty("--canvas-display-h", Math.floor(650 * scale) + "px");
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 300));

/* =========================
   CONSTANTES
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
const LOG_LANES = [95, 135, 175, 215];

/* =========================
   DEFINIÇÃO DAS 10 FASES
   type: "road" | "river" | "both" | "fog" | "night"
   Cada fase pode ter modificadores especiais.
========================= */
const PHASE_DEFS = [
    // 1 — tutorial
    { label:"1 - Rua Tranquila",  type:"road",  carLanes:2, carCount:1, carSpeed:1.0, logs:3, logSpeed:0.8,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false },
    // 2 — um pouco mais movido
    { label:"2 - Hora do Rush",   type:"road",  carLanes:3, carCount:2, carSpeed:1.4, logs:3, logSpeed:0.9,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false },
    // 3 — estrada mais rápida
    { label:"3 - Pista Rápida",   type:"road",  carLanes:4, carCount:2, carSpeed:1.9, logs:3, logSpeed:1.0,  logW:125, sinkLogs:false, rocks:0, fog:false, night:false },
    // 4 — rio aparece
    { label:"4 - Rio Calmo",      type:"both",  carLanes:3, carCount:2, carSpeed:1.6, logs:3, logSpeed:1.0,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false },
    // 5 — pedras fixas no rio
    { label:"5 - Pedras no Rio",  type:"both",  carLanes:3, carCount:2, carSpeed:1.8, logs:3, logSpeed:1.2,  logW:120, sinkLogs:false, rocks:3, fog:false, night:false },
    // 6 — troncos menores, rio mais rápido
    { label:"6 - Correnteza",     type:"both",  carLanes:4, carCount:2, carSpeed:2.0, logs:3, logSpeed:1.6,  logW:100, sinkLogs:false, rocks:2, fog:false, night:false },
    // 7 — neblina (visibilidade reduzida)
    { label:"7 - Neblina",        type:"both",  carLanes:4, carCount:2, carSpeed:2.1, logs:3, logSpeed:1.5,  logW:110, sinkLogs:false, rocks:2, fog:true,  night:false },
    // 8 — noite (faróis piscam, escuro)
    { label:"8 - Noite Fechada",  type:"both",  carLanes:4, carCount:3, carSpeed:2.3, logs:3, logSpeed:1.7,  logW:105, sinkLogs:false, rocks:2, fog:false, night:true  },
    // 9 — troncos que afundam
    { label:"9 - Troncos Podres", type:"both",  carLanes:5, carCount:2, carSpeed:2.5, logs:3, logSpeed:1.8,  logW:100, sinkLogs:true,  rocks:3, fog:false, night:true  },
    // 10 — caos total
    { label:"10 - Caos Total",    type:"both",  carLanes:5, carCount:3, carSpeed:3.0, logs:3, logSpeed:2.2,  logW: 90, sinkLogs:true,  rocks:4, fog:true,  night:true  },
];

/* =========================
   ESTADO DO JOGO
========================= */
const game = {
    running: false, phase: 1, lives: 3,
    maxPhase: PHASE_DEFS.length,
    score: 0, highScore: 0,
    dyingCooldown: 0, phaseTimer: 0, tick: 0,
    player: { x:230, y:570, size:32, step:40, lastDir:"up", jumping:0, tongue:0 },
    cars:[], logs:[], rocks:[], particles:[],
};

/* =========================
   EVENTOS
========================= */
let loopId = null;

playBtn.addEventListener("click",           () => startGame());
restartBtn.addEventListener("click",        () => startGame());
victoryRestartBtn.addEventListener("click", () => startGame());
menuBtn.addEventListener("click",           goToMenu);
menuFromGameOver.addEventListener("click",  goToMenu);
menuFromVictory.addEventListener("click",   goToMenu);

document.querySelectorAll("[data-move]").forEach(btn =>
    btn.addEventListener("click", () => movePlayer(btn.dataset.move))
);
document.addEventListener("keydown", e => {
    if (!game.running) return;
    const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right" };
    if (map[e.key]) { e.preventDefault(); movePlayer(map[e.key]); }
});

/* =========================
   INICIAR
========================= */
function startGame() {
    game.running = false;
    if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
    game.phase=1; game.lives=3; game.score=0; game.tick=0;
    game.dyingCooldown=0; game.phaseTimer=0; game.particles=[];
    game.running = true;
    resetPlayer(); createObjects(); updateHUD();
    showScreen("game");
    loopId = requestAnimationFrame(gameLoop);
}
function goToMenu() { game.running=false; showScreen("menu"); }

function showScreen(type) {
    menu.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");
    if (type==="menu")     menu.classList.remove("hidden");
    if (type==="game")     gameScreen.classList.remove("hidden");
    if (type==="gameover") gameOverScreen.classList.remove("hidden");
    if (type==="victory")  victoryScreen.classList.remove("hidden");
}

/* =========================
   LOOP
========================= */
function gameLoop() {
    if (!game.running) { loopId=null; return; }
    update(); draw();
    loopId = requestAnimationFrame(gameLoop);
}

/* =========================
   UPDATE
========================= */
function update() {
    if (game.dyingCooldown>0) game.dyingCooldown--;
    game.phaseTimer++; game.tick++;
    if (game.player.jumping>0) game.player.jumping--;
    if (game.player.tongue>0)  game.player.tongue--;

    const def = phaseDef();
    moveCars();
    if (def.type !== "road") { moveLogs(); applyLogMovement(); updateSinkingLogs(); checkWater(); }
    checkCarCollision();
    checkRockCollision();
    checkVictory();
    updateParticles();
}

function phaseDef() { return PHASE_DEFS[Math.min(game.phase-1, PHASE_DEFS.length-1)]; }

/* =========================
   CRIAR OBJETOS
========================= */
function createObjects() {
    const def = phaseDef();
    createCars(def);
    game.logs=[]; game.rocks=[];
    if (def.type !== "road") { createLogs(def); createRocks(def); }
}

function createCars(def) {
    game.cars=[];
    for (let l=0; l<def.carLanes; l++) {
        const carH  = 28;
        const laneY = CAR_LANES[l] - carH/2;
        const spd   = (def.carSpeed + Math.random()*0.4) * (l%2===0?1:-1);
        for (let i=0; i<def.carCount; i++) {
            game.cars.push({
                x: (CANVAS_W/def.carCount)*i + Math.random()*30,
                y: laneY, width:55, height:carH, speed:spd,
                color:["#ff006e","#8338ec","#ffbe0b","#fb5607","#3a86ff"][l%5],
                // carros que travam na fase 9-10
                braking: false, brakeTimer:0,
            });
        }
    }
}

function createLogs(def) {
    LOG_LANES.forEach((laneY,i) => {
        const h=28, spacing=(CANVAS_W+def.logW)/def.logs;
        const spd = (def.logSpeed + i*0.2) * (i%2===0?1:-1);
        for (let j=0; j<def.logs; j++) {
            game.logs.push({
                x:j*spacing, y:laneY-h/2,
                width:def.logW, height:h, speed:spd,
                // para troncos podres
                sinking: def.sinkLogs,
                sinkTimer: def.sinkLogs ? (200 + Math.random()*200) : Infinity,
                sunk: false, sunkAlpha:1.0,
                originalW: def.logW,
            });
        }
    });
}

function createRocks(def) {
    for (let i=0; i<def.rocks; i++) {
        const lane = LOG_LANES[Math.floor(Math.random()*LOG_LANES.length)];
        game.rocks.push({
            x: 40 + Math.random()*(CANVAS_W-80),
            y: lane - 12,
            r: 10 + Math.random()*6,
        });
    }
}

/* =========================
   MOVIMENTO
========================= */
function moveCars() {
    const def = phaseDef();
    game.cars.forEach(car => {
        // carros que freiam (fases avançadas)
        if (game.phase >= 9) {
            car.brakeTimer--;
            if (car.brakeTimer <= 0) {
                car.braking = !car.braking;
                car.brakeTimer = car.braking ? 60+Math.random()*80 : 120+Math.random()*120;
            }
        }
        const spd = car.braking ? car.speed*0.15 : car.speed;
        car.x += spd;
        if (car.speed>0 && car.x> CANVAS_W+10) car.x=-car.width-10;
        if (car.speed<0 && car.x<-car.width-10) car.x= CANVAS_W+10;
    });
}

function moveLogs() {
    game.logs.forEach(log => {
        if (log.sunk) return;
        log.x += log.speed;
        if (log.speed>0 && log.x> CANVAS_W+10)  log.x=-log.width-10;
        if (log.speed<0 && log.x<-log.width-10)  log.x= CANVAS_W+10;
    });
}

function updateSinkingLogs() {
    game.logs.forEach(log => {
        if (!log.sinking || log.sunk) return;
        const p=game.player;
        const onTop = rectsOverlap(p.x,p.y,p.size,p.size, log.x,log.y,log.width,log.height);
        if (onTop) {
            log.sinkTimer -= 2;
            if (log.sinkTimer <= 0) { log.sunk=true; log.sunkAlpha=1.0; }
        } else {
            log.sinkTimer = Math.min(log.sinkTimer+1, phaseDef().sinkLogs ? 250 : Infinity);
        }
    });
    // troncos afundados ressurgem depois de um tempo
    game.logs.forEach(log => {
        if (log.sunk) {
            log.sunkAlpha -= 0.015;
            if (log.sunkAlpha <= 0) {
                log.sunk=false; log.sinkTimer=200+Math.random()*200; log.sunkAlpha=1;
            }
        }
    });
}

function applyLogMovement() {
    const p=game.player, log=getLogUnder();
    if (log && !log.sunk) {
        p.x += log.speed;
        p.x = Math.max(0, Math.min(CANVAS_W-p.size, p.x));
    }
}

/* =========================
   PLAYER
========================= */
function resetPlayer() {
    game.player.x=230; game.player.y=570;
    game.player.lastDir="up"; game.player.jumping=0; game.player.tongue=0;
}

function movePlayer(dir) {
    if (!game.running) return;
    const p=game.player, s=p.step;
    if (dir==="up")    p.y-=s;
    if (dir==="down")  p.y+=s;
    if (dir==="left")  p.x-=s;
    if (dir==="right") p.x+=s;
    p.x=Math.max(0,Math.min(CANVAS_W-p.size,p.x));
    p.y=Math.max(0,Math.min(CANVAS_H-p.size,p.y));
    p.lastDir=dir; p.jumping=10;
}

/* =========================
   COLISÕES
========================= */
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh) {
    return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}
function getLogUnder() {
    const p=game.player;
    return game.logs.find(l => !l.sunk &&
        rectsOverlap(p.x,p.y,p.size,p.size,l.x,l.y,l.width,l.height)) || null;
}
function checkWater() {
    if (game.dyingCooldown>0) return;
    const p=game.player;
    if (p.y+p.size<=ZONA.rio.y1 || p.y>=ZONA.rio.y2) return;
    if (!getLogUnder()) loseLife();
}
function checkCarCollision() {
    if (game.dyingCooldown>0) return;
    const p=game.player;
    for (const car of game.cars) {
        if (rectsOverlap(p.x,p.y,p.size,p.size,car.x,car.y,car.width,car.height)) {
            loseLife(); return;
        }
    }
}
function checkRockCollision() {
    if (game.dyingCooldown>0) return;
    const p=game.player;
    for (const rock of game.rocks) {
        const dx=(p.x+p.size/2)-rock.x, dy=(p.y+p.size/2)-rock.y;
        if (Math.sqrt(dx*dx+dy*dy) < rock.r+p.size/2-6) { loseLife(); return; }
    }
}
function checkVictory() {
    if (game.player.y+game.player.size<=ZONA.meta.y2) {
        game.player.tongue=30;
        const bonus=Math.max(0,300-game.phaseTimer);
        game.score+=100+game.phase*15+bonus;
        game.phaseTimer=0; game.phase++;
        if (game.phase>game.maxPhase) {
            game.running=false;
            if (game.score>game.highScore) game.highScore=game.score;
            document.getElementById("finalScore").textContent    =game.score;
            document.getElementById("finalHighScore").textContent=game.highScore;
            showScreen("victory"); return;
        }
        spawnParticles(game.player.x+game.player.size/2, game.player.y, "#00ff88", 18);
        createObjects(); resetPlayer(); updateHUD();
    }
}

/* =========================
   VIDAS
========================= */
function loseLife() {
    spawnParticles(game.player.x+game.player.size/2,game.player.y+game.player.size/2,"#ff006e",20);
    game.lives--; game.dyingCooldown=80; updateHUD();
    if (game.lives<=0) {
        game.running=false;
        if (game.score>game.highScore) game.highScore=game.score;
        document.getElementById("finalScoreOver").textContent    =game.score;
        document.getElementById("finalHighScoreOver").textContent=game.highScore;
        showScreen("gameover"); return;
    }
    resetPlayer();
}

/* =========================
   PARTÍCULAS
========================= */
function spawnParticles(x,y,color,count) {
    for (let i=0;i<count;i++) {
        const a=(Math.PI*2/count)*i;
        game.particles.push({
            x,y,vx:Math.cos(a)*(2+Math.random()*3),vy:Math.sin(a)*(2+Math.random()*3),
            alpha:1,color,r:4+Math.random()*3
        });
    }
}
function updateParticles() {
    game.particles=game.particles.filter(p=>p.alpha>0.05);
    game.particles.forEach(p=>{ p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.alpha-=0.03;p.r*=0.96; });
}
function drawParticles() {
    game.particles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.alpha;
        ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

/* =========================
   HUD
========================= */
function updateHUD() {
    const def=phaseDef();
    faseText.textContent  = def ? def.label : game.phase;
    vidasText.textContent = "❤️".repeat(Math.max(0,game.lives));
    scoreText.textContent = game.score;
}

/* =========================================
   DESENHO
========================================= */
function draw() {
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    const def=phaseDef();
    drawBackground(def);
    drawCalcada();
    drawGrassStrips();
    if (def.type!=="road") { drawRiver(def); drawLogs(); drawRocks(); }
    drawRoad(def);
    drawCars(def);
    drawParticles();
    drawPlayer();
    drawMeta();
    if (def.fog)   drawFog();
    if (def.night) drawNight();
    drawPhaseLabel(def);
}

/* --- Background --- */
function drawBackground(def) {
    const night=def.night;
    ctx.fillStyle=night?"#020408":"#050c18";
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
}

/* --- Calçada --- */
function drawCalcada() {
    const y1=ZONA.calcada.y1, h=ZONA.calcada.y2-y1;
    ctx.fillStyle="#1c2a1c"; ctx.fillRect(0,y1,CANVAS_W,h);
    ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
    for (let y=y1;y<ZONA.calcada.y2;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y);ctx.stroke();}
    for (let x=0;x<CANVAS_W;x+=36){ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,ZONA.calcada.y2);ctx.stroke();}
    ctx.strokeStyle="rgba(0,255,100,0.15)"; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,y1);ctx.lineTo(CANVAS_W,y1);ctx.stroke();
}

/* --- Grama --- */
function drawGrassStrips() {
    [[ZONA.grama1],[ZONA.grama2]].forEach(([z])=>{
        const h=z.y2-z.y1;
        ctx.fillStyle="#1e5c32"; ctx.fillRect(0,z.y1,CANVAS_W,h);
        ctx.fillStyle="rgba(255,255,255,0.025)";
        for (let x=0;x<CANVAS_W;x+=12) ctx.fillRect(x,z.y1,6,h);
        ctx.strokeStyle="rgba(80,200,80,0.18)"; ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(0,z.y1);ctx.lineTo(CANVAS_W,z.y1);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,z.y2-1);ctx.lineTo(CANVAS_W,z.y2-1);ctx.stroke();
    });
}

/* --- Rio --- */
function drawRiver(def) {
    const ry1=ZONA.rio.y1, rh=ZONA.rio.y2-ry1, t=game.tick;
    const grad=ctx.createLinearGradient(0,ry1,0,ZONA.rio.y2);
    const fast=def.logSpeed>1.5;
    grad.addColorStop(0,   fast?"#001830":"#001a40");
    grad.addColorStop(0.5, fast?"#00295e":"#002e6a");
    grad.addColorStop(1,   fast?"#001830":"#001a40");
    ctx.fillStyle=grad; ctx.fillRect(0,ry1,CANVAS_W,rh);

    ctx.fillStyle="rgba(0,100,255,0.05)";
    ctx.fillRect(((t*0.4)%(CANVAS_W+60))-30, ry1, 40, rh);

    // ondas
    [[18,3.5,0.025,0.04,0.45,2],[38,2.5,0.03,0.06,0.3,1.5],[58,4,0.02,0.03,0.2,2]].forEach(([yo,amp,freq,spd,alpha,lw])=>{
        for (let row=0;row<4;row++) {
            const by=ry1+row*40;
            ctx.beginPath(); ctx.strokeStyle=`rgba(100,180,255,${alpha})`; ctx.lineWidth=lw;
            for (let x=0;x<=CANVAS_W;x+=3) {
                const y=by+yo+Math.sin(x*freq+t*spd+row)*amp;
                x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
    });
    // sparkles
    ctx.fillStyle="rgba(180,230,255,0.5)";
    for (let i=0;i<8;i++){
        const sx=((t*(0.5+i*0.3)+i*80)%CANVAS_W);
        const sy=ry1+10+(i*29)%rh;
        const sr=1.4+Math.sin(t*0.1+i)*0.8;
        ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
    }
}

/* --- Pedras no rio --- */
function drawRocks() {
    game.rocks.forEach(rock=>{
        ctx.save();
        // sombra
        ctx.fillStyle="rgba(0,0,0,0.3)";
        ctx.beginPath();ctx.ellipse(rock.x+2,rock.y+rock.r+2,rock.r*0.9,rock.r*0.4,0,0,Math.PI*2);ctx.fill();
        // corpo
        const rg=ctx.createRadialGradient(rock.x-rock.r*0.3,rock.y-rock.r*0.3,1,rock.x,rock.y,rock.r);
        rg.addColorStop(0,"#8a8a8a"); rg.addColorStop(0.6,"#555"); rg.addColorStop(1,"#2a2a2a");
        ctx.fillStyle=rg;
        ctx.beginPath();ctx.arc(rock.x,rock.y,rock.r,0,Math.PI*2);ctx.fill();
        // brilho
        ctx.fillStyle="rgba(255,255,255,0.2)";
        ctx.beginPath();ctx.ellipse(rock.x-rock.r*0.3,rock.y-rock.r*0.3,rock.r*0.3,rock.r*0.2,0,0,Math.PI*2);ctx.fill();
        ctx.restore();
    });
}

/* --- Troncos --- */
function drawLogs() {
    game.logs.forEach(log=>{
        if (log.sunkAlpha<0.01) return;
        ctx.save(); ctx.globalAlpha=log.sunk ? log.sunkAlpha : 1;
        const {x,y,width:w,height:h}=log;

        // pulso de aviso quando prestes a afundar
        if (log.sinking && !log.sunk && log.sinkTimer < 80) {
            const pulse=Math.abs(Math.sin(game.tick*0.25));
            ctx.shadowColor=`rgba(255,80,0,${pulse})`; ctx.shadowBlur=16;
        }

        // sombra
        ctx.fillStyle="rgba(0,0,0,0.2)";
        ctx.beginPath();ctx.ellipse(x+w/2,y+h+3,w/2-2,5,0,0,Math.PI*2);ctx.fill();

        // gradiente madeira
        const wg=ctx.createLinearGradient(x,y,x,y+h);
        wg.addColorStop(0,"#a0622a");wg.addColorStop(0.3,"#7c4a1e");
        wg.addColorStop(0.7,"#6b3d14");wg.addColorStop(1,"#8a5220");
        ctx.fillStyle=wg;
        ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();
        ctx.shadowBlur=0;

        // veios
        ctx.strokeStyle="rgba(60,30,10,0.45)"; ctx.lineWidth=1.5;
        for (let i=0;i<3;i++){
            const ly=y+5+i*(h/3.5);
            ctx.beginPath();ctx.moveTo(x+4,ly);
            ctx.bezierCurveTo(x+w*0.3,ly-1.5,x+w*0.7,ly+1.5,x+w-4,ly);ctx.stroke();
        }
        // anéis
        ["#c47a3a","#9c5c28"].forEach((col,ci)=>{
            const ex=ci===0?x+5:x+w-5;
            ctx.strokeStyle=col;ctx.lineWidth=1;
            ctx.beginPath();ctx.ellipse(ex,y+h/2,3,h/2-2,0,0,Math.PI*2);ctx.stroke();
            ctx.beginPath();ctx.ellipse(ex,y+h/2,1.5,h/2-4,0,0,Math.PI*2);ctx.stroke();
        });
        ctx.strokeStyle="rgba(255,200,120,0.28)";ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x+6,y+2);ctx.lineTo(x+w-6,y+2);ctx.stroke();
        ctx.restore();
    });
}

/* --- Estrada --- */
function drawRoad(def) {
    const ry1=ZONA.estrada.y1, rh=ZONA.estrada.y2-ry1;
    ctx.fillStyle=def.night?"#0e0e0e":"#141414"; ctx.fillRect(0,ry1,CANVAS_W,rh);
    ctx.fillStyle="rgba(255,255,255,0.016)";
    for (let i=0;i<120;i++) ctx.fillRect((i*37)%CANVAS_W, ry1+(i*53)%rh, 2, 2);
    ctx.strokeStyle="rgba(255,255,255,0.13)"; ctx.lineWidth=3; ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(0,ry1+1);ctx.lineTo(CANVAS_W,ry1+1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,ZONA.estrada.y2-1);ctx.lineTo(CANVAS_W,ZONA.estrada.y2-1);ctx.stroke();
    const off=(game.tick*1.5)%35;
    ctx.setLineDash([20,15]); ctx.lineDashOffset=-off;
    ctx.strokeStyle="rgba(255,255,200,0.2)"; ctx.lineWidth=2;
    CAR_LANES.slice(0,-1).forEach(ly=>{
        ctx.beginPath();ctx.moveTo(0,ly+14);ctx.lineTo(CANVAS_W,ly+14);ctx.stroke();
    });
    ctx.setLineDash([]); ctx.lineDashOffset=0;
}

/* --- Carros --- */
function drawCars(def) {
    const t=game.tick;
    game.cars.forEach(car=>{
        const {x,y,width:w,height:h,color,speed}=car;
        const goR=speed>0;

        // faróis piscam na noite
        const headOn = !def.night || (Math.floor(t/20)%2===0);

        // sombra
        ctx.fillStyle="rgba(0,0,0,0.28)";
        ctx.beginPath();ctx.ellipse(x+w/2,y+h+3,w/2-2,4,0,0,Math.PI*2);ctx.fill();

        // carroceria
        ctx.shadowColor=color; ctx.shadowBlur=def.night?14:8;
        const bg=ctx.createLinearGradient(x,y,x,y+h);
        bg.addColorStop(0,lightenColor(color,40));
        bg.addColorStop(0.4,color);
        bg.addColorStop(1,darkenColor(color,40));
        ctx.fillStyle=bg;
        ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();
        ctx.shadowBlur=0;

        // teto
        ctx.fillStyle=darkenColor(color,20);
        ctx.beginPath();ctx.roundRect(x+10,y-7,w-20,10,[4,4,0,0]);ctx.fill();

        // janelas
        ctx.fillStyle="rgba(150,220,255,0.3)";
        if (goR){
            ctx.beginPath();ctx.roundRect(x+w-20,y-6,14,9,2);ctx.fill();
            ctx.beginPath();ctx.roundRect(x+6,y-6,10,9,2);ctx.fill();
        } else {
            ctx.beginPath();ctx.roundRect(x+6,y-6,14,9,2);ctx.fill();
            ctx.beginPath();ctx.roundRect(x+w-16,y-6,10,9,2);ctx.fill();
        }

        // rodas
        [x+7,x+w-13].forEach(wx=>{
            ctx.fillStyle="#111";ctx.beginPath();ctx.ellipse(wx,y+h-1,6,5,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle="#555";ctx.beginPath();ctx.ellipse(wx,y+h-1,3,3,0,0,Math.PI*2);ctx.fill();
        });

        // freando — fumaça
        if (car.braking) {
            ctx.fillStyle="rgba(200,200,200,0.25)";
            const sx=goR?x:x+w;
            ctx.beginPath();ctx.arc(sx,y+h/2,8+Math.sin(t*0.3)*3,0,Math.PI*2);ctx.fill();
        }

        // faróis
        if (headOn){
            const hx=goR?x+w-4:x+2;
            ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?22:12;
            ctx.beginPath();ctx.ellipse(hx,y+5,3,2.5,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(hx,y+h-5,3,2.5,0,0,Math.PI*2);ctx.fill();
        }
        // lanternas
        const tx=goR?x+2:x+w-2;
        ctx.fillStyle="#ff2222";ctx.shadowColor="#ff0000";ctx.shadowBlur=8;
        ctx.beginPath();ctx.ellipse(tx,y+5,2.5,2,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(tx,y+h-5,2.5,2,0,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    });
}

/* --- SAPO (versão melhorada) --- */
function drawPlayer() {
    const p=game.player;
    if (game.dyingCooldown>0 && Math.floor(game.dyingCooldown/5)%2===0) return;

    ctx.save();
    const jumping=p.jumping>0;
    const squX=jumping?0.80:1, squY=jumping?1.25:1;
    const cx=p.x+p.size/2, cy=p.y+p.size/2;
    ctx.translate(cx,cy);
    const rotMap={up:0,down:Math.PI,left:-Math.PI/2,right:Math.PI/2};
    ctx.rotate(rotMap[p.lastDir]||0);
    ctx.scale(squX,squY);
    ctx.translate(-cx,-cy);

    const px=p.x, py=p.y, ps=p.size;
    const cx2=px+ps/2;

    // --- sombra ---
    ctx.fillStyle="rgba(0,0,0,0.25)";
    ctx.beginPath();ctx.ellipse(cx2,py+ps+4,ps/2-2,5,0,0,Math.PI*2);ctx.fill();

    // --- PATAS TRASEIRAS animadas ---
    const legAngle = jumping ? 0.6 : 0.25;
    ctx.fillStyle="#009944";
    // esquerda
    ctx.save();
    ctx.translate(px+3, py+ps-4);
    ctx.rotate(Math.PI/2+legAngle);
    ctx.beginPath();
    ctx.ellipse(0,0,4,10,0,0,Math.PI*2);ctx.fill();
    // dedos esquerda
    ctx.fillStyle="#007733";
    [-4,0,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-11,2,3,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();
    // direita
    ctx.save();
    ctx.translate(px+ps-3,py+ps-4);
    ctx.rotate(-Math.PI/2-legAngle);
    ctx.fillStyle="#009944";
    ctx.beginPath();ctx.ellipse(0,0,4,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#007733";
    [-4,0,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-11,2,3,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();

    // --- CORPO com gradiente rico ---
    const bodyG=ctx.createRadialGradient(cx2,py+ps*0.6,2,cx2,py+ps*0.6,ps*0.6);
    bodyG.addColorStop(0,"#2eff8a");
    bodyG.addColorStop(0.5,"#00cc55");
    bodyG.addColorStop(1,"#006630");
    ctx.fillStyle=bodyG;
    ctx.shadowColor="#00ff88"; ctx.shadowBlur=12;
    ctx.beginPath();ctx.roundRect(px+1,py+ps*0.35,ps-2,ps*0.65,[4,4,10,10]);ctx.fill();
    ctx.shadowBlur=0;

    // --- manchas decorativas no corpo ---
    ctx.fillStyle="rgba(0,80,30,0.35)";
    ctx.beginPath();ctx.ellipse(cx2-5,py+ps*0.6,4,3,0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx2+6,py+ps*0.72,3,2,-0.2,0,Math.PI*2);ctx.fill();

    // --- barriga ---
    const bellG=ctx.createRadialGradient(cx2,py+ps*0.68,0,cx2,py+ps*0.68,ps*0.28);
    bellG.addColorStop(0,"rgba(220,255,230,0.4)");
    bellG.addColorStop(1,"rgba(0,100,40,0)");
    ctx.fillStyle=bellG;
    ctx.beginPath();ctx.ellipse(cx2,py+ps*0.68,ps*0.28,ps*0.22,0,0,Math.PI*2);ctx.fill();

    // --- PATAS DIANTEIRAS ---
    const armAngle = jumping ? -0.8 : -0.3;
    ctx.fillStyle="#00b84a";
    ctx.save();
    ctx.translate(px+3,py+ps*0.42);
    ctx.rotate(-armAngle);
    ctx.beginPath();ctx.ellipse(0,0,3,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#007733";
    [-2,1,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-8,1.5,2.5,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();
    ctx.save();
    ctx.translate(px+ps-3,py+ps*0.42);
    ctx.rotate(armAngle);
    ctx.fillStyle="#00b84a";
    ctx.beginPath();ctx.ellipse(0,0,3,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#007733";
    [-2,1,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-8,1.5,2.5,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();

    // --- CABEÇA ---
    const headG=ctx.createRadialGradient(cx2,py+7,1,cx2,py+10,14);
    headG.addColorStop(0,"#44ffaa");
    headG.addColorStop(1,"#009944");
    ctx.fillStyle=headG;
    ctx.shadowColor="#00ff88"; ctx.shadowBlur=10;
    ctx.beginPath();ctx.roundRect(px+2,py,ps-4,ps*0.42,[10,10,4,4]);ctx.fill();
    ctx.shadowBlur=0;

    // --- linha da boca (base) ---
    ctx.strokeStyle="#005522"; ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(px+8,py+ps*0.35);ctx.lineTo(px+ps-8,py+ps*0.35);ctx.stroke();

    // --- LÍNGUA (ao chegar na meta) ---
    if (p.tongue>0) {
        const progress=1-(p.tongue/30);
        const tongueLen=18*Math.sin(progress*Math.PI);
        ctx.fillStyle="#ff4499";
        ctx.shadowColor="#ff4499"; ctx.shadowBlur=8;
        ctx.beginPath();
        ctx.moveTo(cx2-4,py+ps*0.35);
        ctx.lineTo(cx2+4,py+ps*0.35);
        ctx.lineTo(cx2+3,py+ps*0.35+tongueLen);
        ctx.lineTo(cx2-3,py+ps*0.35+tongueLen);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();ctx.arc(cx2,py+ps*0.35+tongueLen,3.5,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }

    // --- OLHOS grandes e expressivos ---
    const eyePos=[[px+7,py+6],[px+ps-7,py+6]];
    eyePos.forEach(([ex,ey])=>{
        // base do olho (protuberância)
        ctx.fillStyle="#00dd66";
        ctx.shadowColor="#00ff88"; ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(ex,ey,6.5,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;

        // íris colorida
        const irisG=ctx.createRadialGradient(ex,ey,0,ex,ey,5);
        irisG.addColorStop(0,"#cc8800");
        irisG.addColorStop(0.5,"#aa6600");
        irisG.addColorStop(1,"#664400");
        ctx.fillStyle=irisG;
        ctx.beginPath();ctx.arc(ex,ey,5,0,Math.PI*2);ctx.fill();

        // pupila vertical (como sapo de verdade)
        ctx.fillStyle="#000";
        ctx.save();
        ctx.translate(ex,ey);
        ctx.beginPath();ctx.ellipse(0.5,0.5,1.5,3.5,0,0,Math.PI*2);ctx.fill();
        ctx.restore();

        // brilho
        ctx.fillStyle="rgba(255,255,255,0.8)";
        ctx.beginPath();ctx.arc(ex+2.5,ey-2,1.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.35)";
        ctx.beginPath();ctx.arc(ex-1.5,ey+1.5,0.8,0,Math.PI*2);ctx.fill();
    });

    // --- narinas ---
    ctx.fillStyle="#004d1a";
    ctx.beginPath();ctx.ellipse(px+10,py+12,2,1.3,0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(px+ps-10,py+12,2,1.3,-0.3,0,Math.PI*2);ctx.fill();

    // --- sorriso expressivo (muda ao pular) ---
    ctx.strokeStyle="#005522"; ctx.lineWidth=1.5;
    ctx.beginPath();
    if (jumping) {
        // boca aberta
        ctx.arc(cx2,py+17,5,0.1,Math.PI-0.1);
    } else {
        ctx.arc(cx2,py+14,4,0.25,Math.PI-0.25);
    }
    ctx.stroke();

    ctx.restore();
}

/* --- Meta pulsante --- */
function drawMeta() {
    const t=game.tick;
    const pulse=0.07+Math.abs(Math.sin(t*0.05))*0.08;
    ctx.fillStyle=`rgba(0,255,136,${pulse})`;
    ctx.fillRect(0,0,CANVAS_W,ZONA.meta.y2);
    ctx.strokeStyle=`rgba(0,255,136,${0.4+Math.sin(t*0.08)*0.3})`;
    ctx.lineWidth=2; ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(0,ZONA.meta.y2);ctx.lineTo(CANVAS_W,ZONA.meta.y2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=`rgba(0,255,136,${0.7+Math.sin(t*0.1)*0.3})`;
    ctx.font="bold 14px Arial"; ctx.textAlign="center";
    ctx.fillText("▲  M E T A  ▲",CANVAS_W/2,38);
    ctx.textAlign="left";
}

/* --- Neblina --- */
function drawFog() {
    const t=game.tick;
    for (let i=0;i<5;i++) {
        const fx=((t*(0.3+i*0.15)+i*130)%(CANVAS_W+200))-100;
        const fy=100+(i*97)%500;
        const fr=80+Math.sin(t*0.02+i)*20;
        const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
        fg.addColorStop(0,"rgba(220,230,240,0.22)");
        fg.addColorStop(1,"rgba(220,230,240,0)");
        ctx.fillStyle=fg;
        ctx.beginPath();ctx.arc(fx,fy,fr,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="rgba(200,215,230,0.06)";
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
}

/* --- Noite --- */
function drawNight() {
    // overlay escuro gradiente
    const ng=ctx.createLinearGradient(0,0,0,CANVAS_H);
    ng.addColorStop(0,"rgba(0,0,10,0.72)");
    ng.addColorStop(0.5,"rgba(0,0,8,0.55)");
    ng.addColorStop(1,"rgba(0,0,10,0.72)");
    ctx.fillStyle=ng; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    // cones de luz dos carros (apenas na direção que seguem)
    game.cars.forEach(car=>{
        const goR=car.speed>0;
        const hx=goR?car.x+car.width:car.x;
        const hy=car.y+car.height/2;
        const lg=ctx.createRadialGradient(hx,hy,0,hx,hy,90);
        lg.addColorStop(0,"rgba(255,250,200,0.18)");
        lg.addColorStop(1,"rgba(255,250,200,0)");
        ctx.fillStyle=lg;
        ctx.beginPath();
        if (goR) {
            ctx.moveTo(hx,hy);
            ctx.lineTo(hx+90,hy-30);
            ctx.lineTo(hx+90,hy+30);
        } else {
            ctx.moveTo(hx,hy);
            ctx.lineTo(hx-90,hy-30);
            ctx.lineTo(hx-90,hy+30);
        }
        ctx.closePath(); ctx.fill();
    });

    // estrelas
    ctx.fillStyle="rgba(255,255,255,0.7)";
    for (let i=0;i<30;i++){
        const sx=(i*73+17)%CANVAS_W;
        const sy=(i*47+11)%60;
        const sr=0.5+Math.sin(game.tick*0.05+i)*0.4;
        ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
    }
}

/* --- Label da fase no canto --- */
function drawPhaseLabel(def) {
    if (!def) return;
    const alpha=Math.max(0, 1-game.phaseTimer/120);
    if (alpha<=0) return;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle="rgba(0,0,0,0.5)";
    ctx.beginPath();ctx.roundRect(CANVAS_W/2-120,CANVAS_H/2-22,240,44,10);ctx.fill();
    ctx.fillStyle="#00f7ff";
    ctx.font="bold 18px Arial"; ctx.textAlign="center";
    ctx.shadowColor="#00f7ff"; ctx.shadowBlur=10;
    ctx.fillText(def.label, CANVAS_W/2, CANVAS_H/2+6);
    ctx.shadowBlur=0; ctx.restore();
}

/* --- Helpers de cor --- */
function lightenColor(hex,amt){
    const n=parseInt(hex.replace("#",""),16);
    return `rgb(${Math.min(255,(n>>16)+amt)},${Math.min(255,((n>>8)&0xff)+amt)},${Math.min(255,(n&0xff)+amt)})`;
}
function darkenColor(hex,amt){
    const n=parseInt(hex.replace("#",""),16);
    return `rgb(${Math.max(0,(n>>16)-amt)},${Math.max(0,((n>>8)&0xff)-amt)},${Math.max(0,(n&0xff)-amt)})`;
}

}; // fim window.onload
