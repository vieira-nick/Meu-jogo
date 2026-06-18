window.onload = function(){

/* =========================
   ELEMENTOS
========================= */
const menu              = document.getElementById("menu");
const gameScreen        = document.getElementById("gameScreen");
const gameOverScreen    = document.getElementById("gameOver");
const victoryScreen     = document.getElementById("victory");
const playBtn           = document.getElementById("playBtn");
const restartBtn        = document.getElementById("restartBtn");
const victoryRestartBtn = document.getElementById("victoryRestartBtn");
const menuBtn           = document.getElementById("menuBtn");
const menuFromGameOver  = document.getElementById("menuFromGameOver");
const menuFromVictory   = document.getElementById("menuFromVictory");
const faseText          = document.getElementById("fase");
const vidasText         = document.getElementById("vidas");
const scoreText         = document.getElementById("score");
const canvas            = document.getElementById("gameCanvas");
const ctx               = canvas.getContext("2d");

/* =========================
   ESCALA RESPONSIVA
========================= */
function resizeCanvas() {
    const maxW  = window.innerWidth  - 24;
    const maxH  = window.innerHeight - 240;
    const scale = Math.min(maxW / 500, maxH / 650, 1);
    document.documentElement.style.setProperty("--canvas-display-w", Math.floor(500*scale)+"px");
    document.documentElement.style.setProperty("--canvas-display-h", Math.floor(650*scale)+"px");
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", ()=>setTimeout(resizeCanvas,300));

/* =========================
   SONS (Web Audio API — sem arquivos externos)
========================= */
const AC = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAC() {
    if (!audioCtx) audioCtx = new AC();
    return audioCtx;
}

function playTone(freq, type, dur, vol=0.18, delay=0) {
    try {
        const ac  = getAC();
        const osc = ac.createOscillator();
        const gain= ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime+delay);
        gain.gain.setValueAtTime(vol, ac.currentTime+delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+delay+dur);
        osc.start(ac.currentTime+delay);
        osc.stop(ac.currentTime+delay+dur);
    } catch(e){}
}

function sfx(name) {
    try {
        const ac = getAC();
        switch(name) {

            case "jump": {
                // salto: chirp rápido subindo
                const o=ac.createOscillator(), g=ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type="sine";
                o.frequency.setValueAtTime(280,ac.currentTime);
                o.frequency.exponentialRampToValueAtTime(560,ac.currentTime+0.08);
                g.gain.setValueAtTime(0.14,ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.12);
                o.start(); o.stop(ac.currentTime+0.12);
                break;
            }

            case "die": {
                // batida + descida cromática
                [260,210,165,120].forEach((f,i)=>{
                    const o=ac.createOscillator(),g=ac.createGain();
                    o.connect(g);g.connect(ac.destination);
                    o.type=i===0?"square":"sawtooth";
                    o.frequency.setValueAtTime(f,ac.currentTime+i*0.1);
                    o.frequency.exponentialRampToValueAtTime(f*0.7,ac.currentTime+i*0.1+0.12);
                    g.gain.setValueAtTime(0.22,ac.currentTime+i*0.1);
                    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*0.1+0.18);
                    o.start(ac.currentTime+i*0.1); o.stop(ac.currentTime+i*0.1+0.2);
                });
                break;
            }

            case "splash": {
                // ruído branco com pitch descendente
                const bufLen=ac.sampleRate*0.35;
                const buf=ac.createBuffer(1,bufLen,ac.sampleRate);
                const data=buf.getChannelData(0);
                for(let i=0;i<bufLen;i++) data[i]=(Math.random()*2-1)*0.3*(1-i/bufLen);
                const src=ac.createBufferSource();
                const flt=ac.createBiquadFilter();
                const g=ac.createGain();
                flt.type="bandpass"; flt.frequency.setValueAtTime(800,ac.currentTime);
                flt.frequency.exponentialRampToValueAtTime(200,ac.currentTime+0.35);
                src.buffer=buf; src.connect(flt); flt.connect(g); g.connect(ac.destination);
                g.gain.setValueAtTime(0.5,ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.35);
                src.start(); src.stop(ac.currentTime+0.35);
                break;
            }

            case "score": {
                // 3 notas alegres em arpejo
                [660,880,1320].forEach((f,i)=>{
                    const o=ac.createOscillator(),g=ac.createGain();
                    o.connect(g);g.connect(ac.destination);
                    o.type="triangle";
                    o.frequency.setValueAtTime(f,ac.currentTime+i*0.07);
                    g.gain.setValueAtTime(0.18,ac.currentTime+i*0.07);
                    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*0.07+0.12);
                    o.start(ac.currentTime+i*0.07); o.stop(ac.currentTime+i*0.07+0.14);
                });
                break;
            }

            case "victory": {
                // fanfarra ascendente + harmônico
                [523,659,784,1046,1318].forEach((f,i)=>{
                    const o=ac.createOscillator(),g=ac.createGain();
                    o.connect(g);g.connect(ac.destination);
                    o.type=i<3?"sine":"triangle";
                    o.frequency.setValueAtTime(f,ac.currentTime+i*0.11);
                    g.gain.setValueAtTime(0.2,ac.currentTime+i*0.11);
                    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*0.11+0.25);
                    o.start(ac.currentTime+i*0.11); o.stop(ac.currentTime+i*0.11+0.28);
                });
                break;
            }

            case "gameover": {
                // queda triste
                [330,294,262,220,165].forEach((f,i)=>{
                    const o=ac.createOscillator(),g=ac.createGain();
                    o.connect(g);g.connect(ac.destination);
                    o.type="sawtooth";
                    o.frequency.setValueAtTime(f,ac.currentTime+i*0.2);
                    g.gain.setValueAtTime(0.18,ac.currentTime+i*0.2);
                    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*0.2+0.25);
                    o.start(ac.currentTime+i*0.2); o.stop(ac.currentTime+i*0.2+0.28);
                });
                break;
            }

            case "log_warn": {
                // aviso tronco afundando — bip grave
                playTone(180,"sine",0.05,0.08);
                break;
            }

            case "phase": {
                // jingle de nova fase
                [440,554,659].forEach((f,i)=>{
                    const o=ac.createOscillator(),g=ac.createGain();
                    o.connect(g);g.connect(ac.destination);
                    o.type="sine";
                    o.frequency.setValueAtTime(f,ac.currentTime+i*0.08);
                    g.gain.setValueAtTime(0.15,ac.currentTime+i*0.08);
                    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*0.08+0.14);
                    o.start(ac.currentTime+i*0.08); o.stop(ac.currentTime+i*0.08+0.16);
                });
                break;
            }
        }
    } catch(e){}
}

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
const CAR_LANES = [310,355,400,445,490];
const LOG_LANES = [95,135,175,215];

/* =========================
   TIPOS DE VEÍCULOS
   kind: car | truck | moto | ambulance | taxi | bus
========================= */
const VEHICLE_TYPES = {
    car:       { w:55, h:26, draw: drawCar       },
    taxi:      { w:55, h:26, draw: drawTaxi      },
    truck:     { w:85, h:30, draw: drawTruck     },
    bus:       { w:95, h:32, draw: drawBus       },
    moto:      { w:32, h:18, draw: drawMoto      },
    ambulance: { w:65, h:30, draw: drawAmbulance },
};

/* =========================
   DEFINIÇÃO DAS 10 FASES
========================= */
const PHASE_DEFS = [
    { label:"1 - Rua Tranquila",  type:"road", carLanes:2, carCount:1, carSpeed:1.0, logs:3, logSpeed:0.8,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false, vehicles:["car","car","taxi"]          },
    { label:"2 - Hora do Rush",   type:"road", carLanes:3, carCount:2, carSpeed:1.4, logs:3, logSpeed:0.9,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false, vehicles:["car","moto","taxi","car"]     },
    { label:"3 - Pista Rápida",   type:"road", carLanes:4, carCount:2, carSpeed:1.9, logs:3, logSpeed:1.0,  logW:125, sinkLogs:false, rocks:0, fog:false, night:false, vehicles:["car","moto","moto","truck"]   },
    { label:"4 - Rio Calmo",      type:"both", carLanes:3, carCount:2, carSpeed:1.6, logs:3, logSpeed:1.0,  logW:130, sinkLogs:false, rocks:0, fog:false, night:false, vehicles:["car","truck","taxi"]          },
    { label:"5 - Pedras no Rio",  type:"both", carLanes:3, carCount:2, carSpeed:1.8, logs:3, logSpeed:1.2,  logW:120, sinkLogs:false, rocks:3, fog:false, night:false, vehicles:["car","moto","bus","car"]      },
    { label:"6 - Correnteza",     type:"both", carLanes:4, carCount:2, carSpeed:2.0, logs:3, logSpeed:1.6,  logW:100, sinkLogs:false, rocks:2, fog:false, night:false, vehicles:["truck","moto","bus","car"]    },
    { label:"7 - Neblina",        type:"both", carLanes:4, carCount:2, carSpeed:2.1, logs:3, logSpeed:1.5,  logW:110, sinkLogs:false, rocks:2, fog:true,  night:false, vehicles:["ambulance","moto","car","bus"]},
    { label:"8 - Noite Fechada",  type:"both", carLanes:4, carCount:3, carSpeed:2.3, logs:3, logSpeed:1.7,  logW:105, sinkLogs:false, rocks:2, fog:false, night:true,  vehicles:["car","moto","truck","taxi"]  },
    { label:"9 - Troncos Podres", type:"both", carLanes:5, carCount:2, carSpeed:2.5, logs:3, logSpeed:1.8,  logW:100, sinkLogs:true,  rocks:3, fog:false, night:true,  vehicles:["ambulance","bus","moto","car"]},
    { label:"10 - Caos Total",    type:"both", carLanes:5, carCount:3, carSpeed:3.0, logs:3, logSpeed:2.2,  logW:90,  sinkLogs:true,  rocks:4, fog:true,  night:true,  vehicles:["bus","truck","moto","ambulance","car"]},
];

/* =========================
   ESTADO DO JOGO
========================= */
const game = {
    running:false, phase:1, lives:3,
    maxPhase:PHASE_DEFS.length,
    score:0, highScore:0,
    dyingCooldown:0, phaseTimer:0, tick:0,
    screenFlash:0,        // frames de flash vermelho ao perder vida
    scorePopups:[],       // textos flutuantes de pontos
    player:{ x:230, y:570, size:32, step:40, lastDir:"up", jumping:0, tongue:0 },
    cars:[], logs:[], rocks:[], particles:[],
};

/* =========================
   EVENTOS
========================= */
let loopId = null;

playBtn.addEventListener("click",           ()=>startGame());
restartBtn.addEventListener("click",        ()=>startGame());
victoryRestartBtn.addEventListener("click", ()=>startGame());
menuBtn.addEventListener("click",           goToMenu);
menuFromGameOver.addEventListener("click",  goToMenu);
menuFromVictory.addEventListener("click",   goToMenu);

document.querySelectorAll("[data-move]").forEach(btn=>
    btn.addEventListener("click", ()=>movePlayer(btn.dataset.move))
);
document.addEventListener("keydown", e=>{
    if (!game.running) return;
    const map={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
    if (map[e.key]){ e.preventDefault(); movePlayer(map[e.key]); }
});

/* =========================
   INICIAR
========================= */
function startGame() {
    game.running=false;
    if (loopId){ cancelAnimationFrame(loopId); loopId=null; }
    game.phase=1; game.lives=3; game.score=0; game.tick=0;
    game.dyingCooldown=0; game.phaseTimer=0;
    game.particles=[]; game.scorePopups=[];
    game.screenFlash=0;
    game.running=true;
    resetPlayer(); createObjects(); updateHUD();
    showScreen("game");
    loopId=requestAnimationFrame(gameLoop);
}
function goToMenu(){ game.running=false; showScreen("menu"); }

function showScreen(type){
    menu.classList.add("hidden");
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");
    if(type==="menu")     menu.classList.remove("hidden");
    if(type==="game")     gameScreen.classList.remove("hidden");
    if(type==="gameover") gameOverScreen.classList.remove("hidden");
    if(type==="victory")  victoryScreen.classList.remove("hidden");
}

/* =========================
   LOOP
========================= */
function gameLoop(){
    if(!game.running){ loopId=null; return; }
    update(); draw();
    loopId=requestAnimationFrame(gameLoop);
}

/* =========================
   UPDATE
========================= */
function update(){
    if(game.dyingCooldown>0) game.dyingCooldown--;
    if(game.screenFlash>0)   game.screenFlash--;
    game.phaseTimer++; game.tick++;
    if(game.player.jumping>0) game.player.jumping--;
    if(game.player.tongue>0)  game.player.tongue--;

    // atualiza popups de score
    game.scorePopups=game.scorePopups.filter(p=>p.life>0);
    game.scorePopups.forEach(p=>{ p.y-=1; p.life--; p.alpha=p.life/40; });

    const def=phaseDef();
    moveCars();
    if(def.type!=="road"){ moveLogs(); applyLogMovement(); updateSinkingLogs(); checkWater(); }
    checkCarCollision();
    checkRockCollision();
    checkVictory();
    updateParticles();
}

function phaseDef(){ return PHASE_DEFS[Math.min(game.phase-1,PHASE_DEFS.length-1)]; }

/* =========================
   CRIAR OBJETOS
========================= */
function createObjects(){
    const def=phaseDef();
    createVehicles(def);
    game.logs=[]; game.rocks=[];
    if(def.type!=="road"){ createLogs(def); createRocks(def); }
}

function createVehicles(def){
    game.cars=[];
    for(let l=0;l<def.carLanes;l++){
        const kind     = def.vehicles[l % def.vehicles.length];
        const vtype    = VEHICLE_TYPES[kind];
        const laneY    = CAR_LANES[l] - vtype.h/2;
        const spd      = (def.carSpeed+Math.random()*0.4)*(l%2===0?1:-1);
        for(let i=0;i<def.carCount;i++){
            game.cars.push({
                x:(CANVAS_W/def.carCount)*i+Math.random()*30,
                y:laneY, width:vtype.w, height:vtype.h,
                speed:spd, kind,
                color:["#ff006e","#8338ec","#ffbe0b","#fb5607","#3a86ff","#06d6a0","#ef233c"][l%7],
                braking:false, brakeTimer:0,
            });
        }
    }
}

function createLogs(def){
    LOG_LANES.forEach((laneY,i)=>{
        const h=28, spacing=(CANVAS_W+def.logW)/def.logs;
        const spd=(def.logSpeed+i*0.2)*(i%2===0?1:-1);
        for(let j=0;j<def.logs;j++){
            game.logs.push({
                x:j*spacing, y:laneY-h/2,
                width:def.logW, height:h, speed:spd,
                sinking:def.sinkLogs,
                sinkTimer:def.sinkLogs?(200+Math.random()*200):Infinity,
                sunk:false, sunkAlpha:1.0,
            });
        }
    });
}

function createRocks(def){
    for(let i=0;i<def.rocks;i++){
        const lane=LOG_LANES[Math.floor(Math.random()*LOG_LANES.length)];
        game.rocks.push({ x:40+Math.random()*(CANVAS_W-80), y:lane-12, r:10+Math.random()*6 });
    }
}

/* =========================
   MOVIMENTO
========================= */
function moveCars(){
    game.cars.forEach(car=>{
        if(game.phase>=9){
            car.brakeTimer--;
            if(car.brakeTimer<=0){
                car.braking=!car.braking;
                car.brakeTimer=car.braking?60+Math.random()*80:120+Math.random()*120;
            }
        }
        const spd=car.braking?car.speed*0.15:car.speed;
        car.x+=spd;
        if(car.speed>0 && car.x>CANVAS_W+10)  car.x=-car.width-10;
        if(car.speed<0 && car.x<-car.width-10) car.x=CANVAS_W+10;
    });
}

function moveLogs(){
    game.logs.forEach(log=>{
        if(log.sunk) return;
        log.x+=log.speed;
        if(log.speed>0 && log.x>CANVAS_W+10)   log.x=-log.width-10;
        if(log.speed<0 && log.x<-log.width-10)  log.x=CANVAS_W+10;
    });
}

function updateSinkingLogs(){
    game.logs.forEach(log=>{
        if(!log.sinking||log.sunk) return;
        const p=game.player;
        const onTop=rectsOverlap(p.x,p.y,p.size,p.size,log.x,log.y,log.width,log.height);
        if(onTop){ log.sinkTimer-=2; if(log.sinkTimer<=0){log.sunk=true;log.sunkAlpha=1;} }
        else { log.sinkTimer=Math.min(log.sinkTimer+1,250); }
    });
    game.logs.forEach(log=>{
        if(log.sunk){
            log.sunkAlpha-=0.015;
            if(log.sunkAlpha<=0){ log.sunk=false; log.sinkTimer=200+Math.random()*200; log.sunkAlpha=1; }
        }
    });
}

function applyLogMovement(){
    const p=game.player, log=getLogUnder();
    if(log&&!log.sunk){ p.x+=log.speed; p.x=Math.max(0,Math.min(CANVAS_W-p.size,p.x)); }
}

/* =========================
   PLAYER
========================= */
function resetPlayer(){
    game.player.x=230; game.player.y=570;
    game.player.lastDir="up"; game.player.jumping=0; game.player.tongue=0;
}

function movePlayer(dir){
    if(!game.running) return;
    const p=game.player, s=p.step;
    if(dir==="up")    p.y-=s;
    if(dir==="down")  p.y+=s;
    if(dir==="left")  p.x-=s;
    if(dir==="right") p.x+=s;
    p.x=Math.max(0,Math.min(CANVAS_W-p.size,p.x));
    p.y=Math.max(0,Math.min(CANVAS_H-p.size,p.y));
    p.lastDir=dir; p.jumping=10;
    sfx("jump");
}

/* =========================
   COLISÕES
========================= */
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){
    return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
}
function getLogUnder(){
    const p=game.player;
    return game.logs.find(l=>!l.sunk&&rectsOverlap(p.x,p.y,p.size,p.size,l.x,l.y,l.width,l.height))||null;
}
function checkWater(){
    if(game.dyingCooldown>0) return;
    const p=game.player;
    if(p.y+p.size<=ZONA.rio.y1||p.y>=ZONA.rio.y2) return;
    if(!getLogUnder()){ sfx("splash"); loseLife(); }
}
function checkCarCollision(){
    if(game.dyingCooldown>0) return;
    const p=game.player;
    for(const car of game.cars){
        if(rectsOverlap(p.x,p.y,p.size,p.size,car.x,car.y,car.width,car.height)){
            sfx("die"); loseLife(); return;
        }
    }
}
function checkRockCollision(){
    if(game.dyingCooldown>0) return;
    const p=game.player;
    for(const rock of game.rocks){
        const dx=(p.x+p.size/2)-rock.x, dy=(p.y+p.size/2)-rock.y;
        if(Math.sqrt(dx*dx+dy*dy)<rock.r+p.size/2-6){ sfx("splash"); loseLife(); return; }
    }
}
function checkVictory(){
    if(game.player.y+game.player.size<=ZONA.meta.y2){
        game.player.tongue=30;
        const bonus=Math.max(0,300-game.phaseTimer);
        const pts=100+game.phase*15+bonus;
        game.score+=pts;
        // popup flutuante de pontos
        game.scorePopups.push({
            x:game.player.x+game.player.size/2,
            y:game.player.y-10,
            text:"+"+pts, life:40, alpha:1,
        });
        sfx("score");
        sfx("phase");
        game.phaseTimer=0; game.phase++;
        if(game.phase>game.maxPhase){
            game.running=false;
            if(game.score>game.highScore) game.highScore=game.score;
            document.getElementById("finalScore").textContent    =game.score;
            document.getElementById("finalHighScore").textContent=game.highScore;
            sfx("victory");
            showScreen("victory"); return;
        }
        spawnParticles(game.player.x+game.player.size/2,game.player.y,"#00ff88",20);
        createObjects(); resetPlayer(); updateHUD();
    }
}

/* =========================
   VIDAS
========================= */
function loseLife(){
    game.screenFlash=20;   // flash vermelho na tela
    spawnParticles(game.player.x+game.player.size/2,game.player.y+game.player.size/2,"#ff006e",24);
    game.lives--; game.dyingCooldown=80; updateHUD();
    if(game.lives<=0){
        game.running=false;
        if(game.score>game.highScore) game.highScore=game.score;
        document.getElementById("finalScoreOver").textContent    =game.score;
        document.getElementById("finalHighScoreOver").textContent=game.highScore;
        sfx("gameover");
        showScreen("gameover"); return;
    }
    resetPlayer();
}

/* =========================
   PARTÍCULAS
========================= */
function spawnParticles(x,y,color,count){
    for(let i=0;i<count;i++){
        const a=(Math.PI*2/count)*i;
        game.particles.push({
            x,y,vx:Math.cos(a)*(2+Math.random()*4),vy:Math.sin(a)*(2+Math.random()*4),
            alpha:1,color,r:3+Math.random()*4,
        });
    }
}
function updateParticles(){
    game.particles=game.particles.filter(p=>p.alpha>0.05);
    game.particles.forEach(p=>{ p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.alpha-=0.028;p.r*=0.96; });
}
function drawParticles(){
    game.particles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.alpha;
        ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        ctx.restore();
    });
}

/* =========================
   HUD
========================= */
function updateHUD(){
    const def=phaseDef();
    faseText.textContent  = def?def.label:game.phase;
    vidasText.textContent = "❤️".repeat(Math.max(0,game.lives));
    scoreText.textContent = game.score;
    // recorde em tempo real no HUD (se elemento existir)
    const hiEl=document.getElementById("highscore");
    if(hiEl) hiEl.textContent = game.highScore;
}

/* =========================================
   DESENHO PRINCIPAL
========================================= */
function draw(){
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    const def=phaseDef();
    drawBackground(def);
    drawCalcada();
    drawGrassStrips();
    if(def.type!=="road"){ drawRiver(def); drawLogs(); drawRocks(); }
    drawRoad(def);
    drawAllVehicles(def);
    drawParticles();
    drawPlayer();
    drawMeta();
    if(def.fog)   drawFog();
    if(def.night) drawNight();
    drawPhaseLabel(def);
    drawScorePopups();
    if(game.screenFlash>0) drawScreenFlash();
}

/* =========================
   EFEITO FLASH (perder vida)
========================= */
function drawScreenFlash(){
    const t  = game.screenFlash;       // 20→0
    const a  = (t/20);                 // 1→0
    // fundo vermelho com vinheta
    const vg = ctx.createRadialGradient(CANVAS_W/2,CANVAS_H/2,60,CANVAS_W/2,CANVAS_H/2,CANVAS_W*0.8);
    vg.addColorStop(0, `rgba(255,0,50,${a*0.25})`);
    vg.addColorStop(1, `rgba(180,0,20,${a*0.65})`);
    ctx.fillStyle=vg; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    // borda pulsante grossa
    ctx.strokeStyle=`rgba(255,20,60,${a})`;
    ctx.lineWidth=18;
    ctx.shadowColor="#ff0040"; ctx.shadowBlur=28;
    ctx.strokeRect(0,0,CANVAS_W,CANVAS_H);
    ctx.shadowBlur=0;

    // "X" central apenas nos primeiros frames
    if(t>14){
        const xA=(t-14)/6;
        ctx.save(); ctx.globalAlpha=xA;
        ctx.strokeStyle="#ff4060"; ctx.lineWidth=6; ctx.shadowColor="#ff0040"; ctx.shadowBlur=20;
        const s=40;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W/2-s,CANVAS_H/2-s); ctx.lineTo(CANVAS_W/2+s,CANVAS_H/2+s);
        ctx.moveTo(CANVAS_W/2+s,CANVAS_H/2-s); ctx.lineTo(CANVAS_W/2-s,CANVAS_H/2+s);
        ctx.stroke();
        ctx.restore();
    }

    // câmera shake: translação pequena baseada no timer
    if(t>6){
        const shk=(t-6)/14*4;
        const sx=(Math.random()-0.5)*shk*2;
        const sy=(Math.random()-0.5)*shk*2;
        ctx.translate(sx,sy);   // aplicado antes de desenhar os frames seguintes
    }
}

/* =========================
   POPUPS DE SCORE
========================= */
function drawScorePopups(){
    game.scorePopups.forEach(p=>{
        ctx.save();
        ctx.globalAlpha=p.alpha;
        // cor muda com o valor: verde=bom, dourado=ótimo, ciano=excelente
        const val=parseInt(p.text.replace("+",""))||0;
        const col=val>300?"#00ffee":val>200?"#ffdd00":"#88ff44";
        ctx.fillStyle=col;
        ctx.shadowColor=col; ctx.shadowBlur=14;
        // tamanho da fonte cresce com o valor
        const fsize=Math.min(28,16+Math.floor(val/60));
        ctx.font=`bold ${fsize}px Arial`; ctx.textAlign="center";
        // contorno escuro para legibilidade
        ctx.strokeStyle="rgba(0,0,0,0.6)"; ctx.lineWidth=3;
        ctx.strokeText(p.text,p.x,p.y);
        ctx.fillText(p.text,p.x,p.y);
        ctx.restore();
    });
}

/* --- Background --- */
function drawBackground(def){
    ctx.fillStyle=def.night?"#020408":"#050c18";
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
}

/* --- Calçada --- */
function drawCalcada(){
    const y1=ZONA.calcada.y1,h=ZONA.calcada.y2-y1;
    ctx.fillStyle="#1c2a1c"; ctx.fillRect(0,y1,CANVAS_W,h);
    ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
    for(let y=y1;y<ZONA.calcada.y2;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y);ctx.stroke();}
    for(let x=0;x<CANVAS_W;x+=36){ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,ZONA.calcada.y2);ctx.stroke();}
    ctx.strokeStyle="rgba(0,255,100,0.15)"; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,y1);ctx.lineTo(CANVAS_W,y1);ctx.stroke();
}

/* --- Grama --- */
function drawGrassStrips(){
    [[ZONA.grama1],[ZONA.grama2]].forEach(([z])=>{
        const h=z.y2-z.y1;
        ctx.fillStyle="#1e5c32"; ctx.fillRect(0,z.y1,CANVAS_W,h);
        ctx.fillStyle="rgba(255,255,255,0.025)";
        for(let x=0;x<CANVAS_W;x+=12) ctx.fillRect(x,z.y1,6,h);
        ctx.strokeStyle="rgba(80,200,80,0.18)"; ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(0,z.y1);ctx.lineTo(CANVAS_W,z.y1);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,z.y2-1);ctx.lineTo(CANVAS_W,z.y2-1);ctx.stroke();
    });
}

/* --- Rio --- */
function drawRiver(def){
    const ry1=ZONA.rio.y1,rh=ZONA.rio.y2-ry1,t=game.tick;
    const fast=def.logSpeed>1.5;
    const grad=ctx.createLinearGradient(0,ry1,0,ZONA.rio.y2);
    grad.addColorStop(0,fast?"#001830":"#001a40");
    grad.addColorStop(0.5,fast?"#00295e":"#002e6a");
    grad.addColorStop(1,fast?"#001830":"#001a40");
    ctx.fillStyle=grad; ctx.fillRect(0,ry1,CANVAS_W,rh);
    ctx.fillStyle="rgba(0,100,255,0.05)";
    ctx.fillRect(((t*0.4)%(CANVAS_W+60))-30,ry1,40,rh);
    [[18,3.5,0.025,0.04,0.45,2],[38,2.5,0.03,0.06,0.3,1.5],[58,4,0.02,0.03,0.2,2]].forEach(([yo,amp,freq,spd,alpha,lw])=>{
        for(let row=0;row<4;row++){
            const by=ry1+row*40;
            ctx.beginPath(); ctx.strokeStyle=`rgba(100,180,255,${alpha})`; ctx.lineWidth=lw;
            for(let x=0;x<=CANVAS_W;x+=3){
                const y=by+yo+Math.sin(x*freq+t*spd+row)*amp;
                x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
    });
    ctx.fillStyle="rgba(180,230,255,0.5)";
    for(let i=0;i<8;i++){
        const sx=((t*(0.5+i*0.3)+i*80)%CANVAS_W);
        const sy=ry1+10+(i*29)%rh;
        ctx.beginPath();ctx.arc(sx,sy,1.4+Math.sin(t*0.1+i)*0.8,0,Math.PI*2);ctx.fill();
    }
}

/* --- Pedras --- */
function drawRocks(){
    game.rocks.forEach(rock=>{
        ctx.save();
        ctx.fillStyle="rgba(0,0,0,0.3)";
        ctx.beginPath();ctx.ellipse(rock.x+2,rock.y+rock.r+2,rock.r*0.9,rock.r*0.4,0,0,Math.PI*2);ctx.fill();
        const rg=ctx.createRadialGradient(rock.x-rock.r*0.3,rock.y-rock.r*0.3,1,rock.x,rock.y,rock.r);
        rg.addColorStop(0,"#8a8a8a");rg.addColorStop(0.6,"#555");rg.addColorStop(1,"#2a2a2a");
        ctx.fillStyle=rg; ctx.beginPath();ctx.arc(rock.x,rock.y,rock.r,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.2)";
        ctx.beginPath();ctx.ellipse(rock.x-rock.r*0.3,rock.y-rock.r*0.3,rock.r*0.3,rock.r*0.2,0,0,Math.PI*2);ctx.fill();
        ctx.restore();
    });
}

/* --- Troncos --- */
function drawLogs(){
    game.logs.forEach(log=>{
        if(log.sunkAlpha<0.01) return;
        ctx.save(); ctx.globalAlpha=log.sunk?log.sunkAlpha:1;
        const{x,y,width:w,height:h}=log;
        if(log.sinking&&!log.sunk&&log.sinkTimer<80){
            ctx.shadowColor=`rgba(255,80,0,${Math.abs(Math.sin(game.tick*0.25))})`; ctx.shadowBlur=16;
        }
        ctx.fillStyle="rgba(0,0,0,0.2)";
        ctx.beginPath();ctx.ellipse(x+w/2,y+h+3,w/2-2,5,0,0,Math.PI*2);ctx.fill();
        const wg=ctx.createLinearGradient(x,y,x,y+h);
        wg.addColorStop(0,"#a0622a");wg.addColorStop(0.3,"#7c4a1e");
        wg.addColorStop(0.7,"#6b3d14");wg.addColorStop(1,"#8a5220");
        ctx.fillStyle=wg; ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();
        ctx.shadowBlur=0;
        ctx.strokeStyle="rgba(60,30,10,0.45)"; ctx.lineWidth=1.5;
        for(let i=0;i<3;i++){
            const ly=y+5+i*(h/3.5);
            ctx.beginPath();ctx.moveTo(x+4,ly);
            ctx.bezierCurveTo(x+w*0.3,ly-1.5,x+w*0.7,ly+1.5,x+w-4,ly);ctx.stroke();
        }
        ["#c47a3a","#9c5c28"].forEach((col,ci)=>{
            const ex=ci===0?x+5:x+w-5;
            ctx.strokeStyle=col;ctx.lineWidth=1;
            ctx.beginPath();ctx.ellipse(ex,y+h/2,3,h/2-2,0,0,Math.PI*2);ctx.stroke();
        });
        ctx.strokeStyle="rgba(255,200,120,0.28)";ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x+6,y+2);ctx.lineTo(x+w-6,y+2);ctx.stroke();
        ctx.restore();
    });
}

/* --- Estrada --- */
function drawRoad(def){
    const ry1=ZONA.estrada.y1,rh=ZONA.estrada.y2-ry1;
    ctx.fillStyle=def.night?"#0e0e0e":"#141414"; ctx.fillRect(0,ry1,CANVAS_W,rh);
    ctx.fillStyle="rgba(255,255,255,0.016)";
    for(let i=0;i<120;i++) ctx.fillRect((i*37)%CANVAS_W,ry1+(i*53)%rh,2,2);
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

/* =========================
   VEÍCULOS — despachante
========================= */
function drawAllVehicles(def){
    game.cars.forEach(car=>{
        const fn=VEHICLE_TYPES[car.kind]?.draw;
        if(fn) fn(car, def);
    });
}

/* helpers compartilhados */
function vehicleShadow(x,y,w,h){
    ctx.fillStyle="rgba(0,0,0,0.28)";
    ctx.beginPath();ctx.ellipse(x+w/2,y+h+3,w/2-2,4,0,0,Math.PI*2);ctx.fill();
}
function vehicleWheels(x,y,w,h){
    [x+8,x+w-12].forEach(wx=>{
        ctx.fillStyle="#111";ctx.beginPath();ctx.ellipse(wx,y+h,6,5,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#444";ctx.beginPath();ctx.ellipse(wx,y+h,3,3,0,0,Math.PI*2);ctx.fill();
        // raios
        ctx.strokeStyle="#666";ctx.lineWidth=1;
        for(let a=0;a<Math.PI*2;a+=Math.PI/3){
            ctx.beginPath();ctx.moveTo(wx,y+h);ctx.lineTo(wx+Math.cos(a)*3,y+h+Math.sin(a)*3);ctx.stroke();
        }
    });
}

/* --- CARRO --- */
function drawCar(car,def){
    const{x,y,width:w,height:h,color,speed}=car;
    const goR=speed>0,t=game.tick;
    vehicleShadow(x,y,w,h);
    ctx.shadowColor=color; ctx.shadowBlur=def.night?14:6;
    const bg=ctx.createLinearGradient(x,y,x,y+h);
    bg.addColorStop(0,lightenColor(color,40));
    bg.addColorStop(0.5,color);
    bg.addColorStop(1,darkenColor(color,40));
    ctx.fillStyle=bg; ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();
    ctx.shadowBlur=0;
    // teto
    ctx.fillStyle=darkenColor(color,25);
    ctx.beginPath();ctx.roundRect(x+10,y-8,w-20,10,[4,4,0,0]);ctx.fill();
    // janelas
    ctx.fillStyle="rgba(160,220,255,0.35)";
    const ww=goR;
    ctx.beginPath();ctx.roundRect(ww?x+w-19:x+5,y-7,13,9,2);ctx.fill();
    ctx.beginPath();ctx.roundRect(ww?x+5:x+w-18,y-7,10,9,2);ctx.fill();
    vehicleWheels(x,y,w,h);
    // faróis
    const headOn=!def.night||(Math.floor(t/20)%2===0);
    if(headOn){
        const hx=goR?x+w-3:x+2;
        ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?20:10;
        ctx.beginPath();ctx.ellipse(hx,y+5,3,2.5,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(hx,y+h-5,3,2.5,0,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }
    const tx=goR?x+2:x+w-2;
    ctx.fillStyle="#ff2222";ctx.shadowColor="#ff0000";ctx.shadowBlur=8;
    ctx.beginPath();ctx.ellipse(tx,y+5,2.5,2,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(tx,y+h-5,2.5,2,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    if(car.braking){
        ctx.fillStyle="rgba(200,200,200,0.22)";
        ctx.beginPath();ctx.arc(goR?x:x+w,y+h/2,8+Math.sin(t*0.3)*3,0,Math.PI*2);ctx.fill();
    }
}

/* --- TÁXI --- */
function drawTaxi(car,def){
    const{x,y,width:w,height:h,speed}=car;
    car.color="#ffbe0b";   // sempre amarelo
    drawCar(car,def);
    // tabuleta TAXI em cima
    ctx.fillStyle="#111";
    ctx.beginPath();ctx.roundRect(x+w/2-12,y-16,24,7,3);ctx.fill();
    ctx.fillStyle="#ffff00";ctx.font="bold 6px Arial";ctx.textAlign="center";
    ctx.fillText("TAXI",x+w/2,y-11);ctx.textAlign="left";
    // listras nas laterais
    ctx.fillStyle="rgba(0,0,0,0.35)";
    for(let i=0;i<3;i++) ctx.fillRect(x+8+i*14,y+h/2-2,8,4);
}

/* --- MOTO --- */
function drawMoto(car,def){
    const{x,y,width:w,height:h,color,speed}=car;
    const goR=speed>0,t=game.tick;
    const cx=x+w/2,cy=y+h/2;

    vehicleShadow(x,y,w,h);

    // rodas grandes
    [x+5,x+w-5].forEach(wx=>{
        ctx.fillStyle="#111";ctx.beginPath();ctx.arc(wx,y+h,8,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#444";ctx.lineWidth=2;ctx.beginPath();ctx.arc(wx,y+h,5,0,Math.PI*2);ctx.stroke();
        // raios girando
        for(let a=(game.tick*0.15)%Math.PI;a<Math.PI*2;a+=Math.PI/3){
            ctx.beginPath();ctx.moveTo(wx,y+h);ctx.lineTo(wx+Math.cos(a)*6,y+h+Math.sin(a)*6);ctx.stroke();
        }
    });

    // quadro
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowColor=color;ctx.shadowBlur=def.night?10:4;
    ctx.beginPath();ctx.moveTo(x+5,y+h);ctx.lineTo(cx,cy);ctx.lineTo(x+w-5,y+h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,y+2);ctx.stroke();
    ctx.shadowBlur=0;

    // guidão
    ctx.strokeStyle=lightenColor(color,30);ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(goR?cx+3:cx-3,y+2);ctx.lineTo(goR?cx+3+9:cx-3-9,y-4);ctx.stroke();

    // motor / tanque
    ctx.fillStyle=darkenColor(color,10);ctx.shadowColor=color;ctx.shadowBlur=6;
    ctx.beginPath();ctx.roundRect(cx-6,cy-4,12,8,4);ctx.fill();
    ctx.shadowBlur=0;

    // piloto — capacete
    const headX=goR?cx+4:cx-4;
    ctx.fillStyle="#222";ctx.beginPath();ctx.arc(headX,cy-10,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(headX,cy-10,5,Math.PI,Math.PI*2);ctx.fill();
    // visor
    ctx.fillStyle="rgba(100,200,255,0.6)";
    ctx.beginPath();ctx.arc(headX,cy-10,3.5,Math.PI*1.1,Math.PI*1.9);ctx.fill();

    // escapamento de fumaça
    if(game.tick%6===0){
        game.particles.push({
            x:goR?x:x+w, y:y+h-2,
            vx:(goR?-0.8:0.8)+Math.random()*0.4,
            vy:-0.3+Math.random()*0.2,
            alpha:0.4, color:"rgba(200,200,200,1)", r:3,
        });
    }

    // faróis
    if(!def.night||(Math.floor(t/20)%2===0)){
        const hx=goR?x+w-2:x+2;
        ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?18:8;
        ctx.beginPath();ctx.ellipse(hx,y+h/2,2,2,0,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }
}

/* --- CAMINHÃO --- */
function drawTruck(car,def){
    const{x,y,width:w,height:h,color,speed}=car;
    const goR=speed>0,t=game.tick;
    vehicleShadow(x,y,w,h);

    // carroceria / baú
    const cabW=goR?24:24;
    const cabX=goR?x+w-cabW:x;
    const cargoX=goR?x:x+cabW;
    const cargoW=w-cabW;

    // baú (carga)
    ctx.fillStyle="#555";
    ctx.beginPath();ctx.roundRect(cargoX,y-2,cargoW,h+2,3);ctx.fill();
    ctx.strokeStyle="#777";ctx.lineWidth=1;
    // ripas do baú
    for(let i=1;i<4;i++){
        const bx=cargoX+cargoW*i/4;
        ctx.beginPath();ctx.moveTo(bx,y-2);ctx.lineTo(bx,y+h);ctx.stroke();
    }
    ctx.strokeStyle="#444";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cargoX,y+h/2);ctx.lineTo(cargoX+cargoW,y+h/2);ctx.stroke();

    // cabine
    ctx.shadowColor=color;ctx.shadowBlur=def.night?12:6;
    const bg=ctx.createLinearGradient(cabX,y,cabX,y+h);
    bg.addColorStop(0,lightenColor(color,30));bg.addColorStop(1,darkenColor(color,30));
    ctx.fillStyle=bg; ctx.beginPath();ctx.roundRect(cabX,y-4,cabW,h+4,[goR?[0,5,5,0]:[5,0,0,5]]);ctx.fill();
    ctx.shadowBlur=0;

    // para-brisas
    ctx.fillStyle="rgba(160,220,255,0.35)";
    ctx.beginPath();ctx.roundRect(cabX+(goR?3:5),y-3,cabW-8,9,2);ctx.fill();

    // 4 rodas
    [x+10,x+w-12,x+w/2-6,x+w/2+6].slice(0,4).forEach(wx=>{
        ctx.fillStyle="#111";ctx.beginPath();ctx.ellipse(wx,y+h,7,6,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#333";ctx.beginPath();ctx.ellipse(wx,y+h,4,4,0,0,Math.PI*2);ctx.fill();
    });

    // faróis
    const headOn=!def.night||(Math.floor(t/20)%2===0);
    if(headOn){
        const hx=goR?cabX+cabW-2:cabX+1;
        ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?24:12;
        ctx.beginPath();ctx.ellipse(hx,y+4,3.5,3,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(hx,y+h-4,3.5,3,0,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }
    // fumaça do escapamento
    if(game.tick%8===0){
        game.particles.push({
            x:goR?x:x+w, y:y-4,
            vx:(goR?-0.5:0.5)+Math.random()*0.3, vy:-0.6+Math.random()*0.3,
            alpha:0.35, color:"rgba(180,180,180,1)", r:4,
        });
    }
}

/* --- ÔNIBUS --- */
function drawBus(car,def){
    const{x,y,width:w,height:h,color,speed}=car;
    const goR=speed>0,t=game.tick;
    vehicleShadow(x,y,w,h);

    // carroceria longa
    ctx.shadowColor=color;ctx.shadowBlur=def.night?14:6;
    const bg=ctx.createLinearGradient(x,y,x,y+h);
    bg.addColorStop(0,lightenColor(color,35));bg.addColorStop(1,darkenColor(color,35));
    ctx.fillStyle=bg; ctx.beginPath();ctx.roundRect(x,y-3,w,h+3,4);ctx.fill();
    ctx.shadowBlur=0;

    // faixa lateral branca
    ctx.fillStyle="rgba(255,255,255,0.25)";
    ctx.fillRect(x+2,y+h*0.3,w-4,6);

    // janelas (múltiplas)
    ctx.fillStyle="rgba(160,220,255,0.4)";
    const winCount=Math.floor(w/18);
    for(let i=0;i<winCount;i++){
        ctx.beginPath();ctx.roundRect(x+4+i*18,y-2,13,10,2);ctx.fill();
    }

    // porta
    const doorX=goR?x+10:x+w-22;
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.fillRect(doorX,y+h/2-4,12,h/2+3);

    // 4 rodas grandes
    [x+12,x+w-14,x+w/2-8,x+w/2+8].forEach(wx=>{
        ctx.fillStyle="#0a0a0a";ctx.beginPath();ctx.ellipse(wx,y+h,8,7,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#333";ctx.beginPath();ctx.ellipse(wx,y+h,4,4,0,0,Math.PI*2);ctx.fill();
    });

    // faróis duplos
    const headOn=!def.night||(Math.floor(t/20)%2===0);
    if(headOn){
        const hx=goR?x+w-2:x+2;
        ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?26:14;
        ctx.beginPath();ctx.ellipse(hx,y+4,3.5,3,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(hx,y+h-4,3.5,3,0,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }
    // lanternas traseiras
    const tx=goR?x+2:x+w-2;
    ctx.fillStyle="#ff2222";ctx.shadowColor="#ff0000";ctx.shadowBlur=8;
    ctx.beginPath();ctx.ellipse(tx,y+4,2.5,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(tx,y+h-4,2.5,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
}

/* --- AMBULÂNCIA --- */
function drawAmbulance(car,def){
    const{x,y,width:w,height:h,speed}=car;
    const goR=speed>0,t=game.tick;
    car.color="#ffffff";
    vehicleShadow(x,y,w,h);

    // carroceria branca
    ctx.fillStyle="#e8e8e8";
    ctx.beginPath();ctx.roundRect(x,y-4,w,h+4,4);ctx.fill();

    // faixa verde lateral
    ctx.fillStyle="#00aa44";
    ctx.fillRect(x+2,y+h*0.3,w-4,7);

    // cruz vermelha
    const mx=x+w/2,my=y+h*0.12;
    ctx.fillStyle="#ee0000";ctx.shadowColor="#ff0000";ctx.shadowBlur=6;
    ctx.fillRect(mx-2,my-7,4,14);
    ctx.fillRect(mx-7,my-2,14,4);
    ctx.shadowBlur=0;

    // janela frontal
    ctx.fillStyle="rgba(160,220,255,0.4)";
    const wx2=goR?x+w-20:x+4;
    ctx.beginPath();ctx.roundRect(wx2,y-3,16,12,2);ctx.fill();

    vehicleWheels(x,y,w,h);

    // sirene piscante
    const siren=Math.floor(t/8)%2===0;
    const s1x=x+w*0.3,s2x=x+w*0.7;
    ctx.fillStyle=siren?"#ff2200":"#0044ff";
    ctx.shadowColor=siren?"#ff0000":"#0088ff"; ctx.shadowBlur=siren?18:12;
    ctx.beginPath();ctx.roundRect(s1x-4,y-10,8,5,3);ctx.fill();
    ctx.fillStyle=siren?"#0044ff":"#ff2200";
    ctx.shadowColor=siren?"#0088ff":"#ff0000";
    ctx.beginPath();ctx.roundRect(s2x-4,y-10,8,5,3);ctx.fill();
    ctx.shadowBlur=0;

    // faróis
    const hx=goR?x+w-2:x+2;
    ctx.fillStyle="#fffbe0";ctx.shadowColor="#fffbe0";ctx.shadowBlur=def.night?20:8;
    ctx.beginPath();ctx.ellipse(hx,y+5,3,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(hx,y+h-5,3,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
}

/* =========================
   SAPO (versão final melhorada)
========================= */
function drawPlayer(){
    const p=game.player;
    if(game.dyingCooldown>0&&Math.floor(game.dyingCooldown/5)%2===0) return;

    ctx.save();
    const jumping=p.jumping>0;
    const squX=jumping?0.78:1, squY=jumping?1.28:1;
    const cx=p.x+p.size/2, cy=p.y+p.size/2;
    ctx.translate(cx,cy);
    const rotMap={up:0,down:Math.PI,left:-Math.PI/2,right:Math.PI/2};
    ctx.rotate(rotMap[p.lastDir]||0);
    ctx.scale(squX,squY);
    ctx.translate(-cx,-cy);

    const px=p.x,py=p.y,ps=p.size,cx2=px+ps/2;

    // sombra no chão
    ctx.fillStyle="rgba(0,0,0,0.22)";
    ctx.beginPath();ctx.ellipse(cx2,py+ps+5,ps/2-2,squX<1?3:5,0,0,Math.PI*2);ctx.fill();

    // ===== PATAS TRASEIRAS =====
    const legA=jumping?0.7:0.2;
    ctx.fillStyle="#00aa44";
    // coxa esquerda
    ctx.save();ctx.translate(px+1,py+ps-4);ctx.rotate(Math.PI/2+legA);
    ctx.beginPath();ctx.ellipse(0,0,4.5,11,0,0,Math.PI*2);ctx.fill();
    // pé esquerdo
    ctx.fillStyle="#009933";
    ctx.beginPath();ctx.ellipse(-1,-12,3.5,5,jumping?-0.4:0.1,0,Math.PI*2);ctx.fill();
    // 3 dedos
    ctx.fillStyle="#007722";
    [-4,0,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-16,1.8,3.5,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();
    // coxa direita
    ctx.save();ctx.translate(px+ps-1,py+ps-4);ctx.rotate(-Math.PI/2-legA);
    ctx.fillStyle="#00aa44";
    ctx.beginPath();ctx.ellipse(0,0,4.5,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#009933";
    ctx.beginPath();ctx.ellipse(1,-12,3.5,5,jumping?0.4:-0.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#007722";
    [-4,0,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-16,1.8,3.5,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();

    // ===== CORPO =====
    // respiração sutil quando parado
    const breathScale = jumping ? 1 : 1 + Math.sin(game.tick*0.06)*0.018;
    ctx.save();
    ctx.translate(cx2, py+ps*0.67);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-cx2, -(py+ps*0.67));

    const bodyG=ctx.createRadialGradient(cx2-3,py+ps*0.55,2,cx2,py+ps*0.6,ps*0.65);
    bodyG.addColorStop(0,"#33ff99");bodyG.addColorStop(0.5,"#00cc55");bodyG.addColorStop(1,"#005528");
    ctx.fillStyle=bodyG;ctx.shadowColor="#00ff88";ctx.shadowBlur=14;
    ctx.beginPath();ctx.roundRect(px,py+ps*0.33,ps,ps*0.67,[3,3,12,12]);ctx.fill();
    ctx.shadowBlur=0;

    // manchas dorsais
    ctx.fillStyle="rgba(0,90,35,0.30)";
    [[cx2-7,py+ps*0.46,5,3.5,0.3],[cx2+5,py+ps*0.58,4,3,-0.2],[cx2-2,py+ps*0.72,4.5,3,0.1]].forEach(([ex,ey,rx,ry,rot])=>{
        ctx.save(); ctx.translate(ex,ey); ctx.rotate(rot);
        ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });

    // escamas / textura
    ctx.strokeStyle="rgba(0,80,30,0.18)"; ctx.lineWidth=1;
    [[cx2-6,py+ps*0.5,4,3],[cx2+4,py+ps*0.63,3,2.5],[cx2-3,py+ps*0.76,3.5,2.5]].forEach(([ex,ey,rx,ry])=>{
        ctx.beginPath();ctx.ellipse(ex,ey,rx,ry,0,0,Math.PI*2);ctx.stroke();
    });
    ctx.restore(); // fim respiração

    // barriga clara com gradiente radial
    const bellG=ctx.createRadialGradient(cx2,py+ps*0.67,0,cx2,py+ps*0.67,ps*0.3);
    bellG.addColorStop(0,"rgba(210,255,225,0.45)");bellG.addColorStop(1,"rgba(0,120,50,0)");
    ctx.fillStyle=bellG;
    ctx.beginPath();ctx.ellipse(cx2,py+ps*0.67,ps*0.3,ps*0.24,0,0,Math.PI*2);ctx.fill();

    // ===== PATAS DIANTEIRAS =====
    const armA=jumping?-0.9:-0.25;
    ctx.fillStyle="#00bb44";
    ctx.save();ctx.translate(px+1,py+ps*0.4);ctx.rotate(-armA);
    ctx.beginPath();ctx.ellipse(0,0,3.5,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#009933";
    [-2,1,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-9,1.8,3,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();
    ctx.save();ctx.translate(px+ps-1,py+ps*0.4);ctx.rotate(armA);
    ctx.fillStyle="#00bb44";
    ctx.beginPath();ctx.ellipse(0,0,3.5,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#009933";
    [-2,1,4].forEach(d=>{ctx.beginPath();ctx.ellipse(d,-9,1.8,3,0,0,Math.PI*2);ctx.fill();});
    ctx.restore();

    // ===== CABEÇA =====
    const headG=ctx.createRadialGradient(cx2-2,py+5,1,cx2,py+9,15);
    headG.addColorStop(0,"#55ffbb");headG.addColorStop(0.6,"#00cc55");headG.addColorStop(1,"#006630");
    ctx.fillStyle=headG;ctx.shadowColor="#00ff88";ctx.shadowBlur=12;
    ctx.beginPath();ctx.roundRect(px+1,py,ps-2,ps*0.4,[12,12,5,5]);ctx.fill();
    ctx.shadowBlur=0;

    // linha da mandíbula
    ctx.strokeStyle="#004d1a";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(px+5,py+ps*0.34);ctx.lineTo(px+ps-5,py+ps*0.34);ctx.stroke();

    // ===== LÍNGUA =====
    if(p.tongue>0){
        const prog=1-(p.tongue/30);
        const tLen=22*Math.sin(prog*Math.PI);
        ctx.fillStyle="#ff3388";ctx.shadowColor="#ff44aa";ctx.shadowBlur=10;
        ctx.beginPath();
        ctx.moveTo(cx2-5,py+ps*0.34);ctx.lineTo(cx2+5,py+ps*0.34);
        ctx.lineTo(cx2+4,py+ps*0.34+tLen);ctx.lineTo(cx2-4,py+ps*0.34+tLen);
        ctx.closePath();ctx.fill();
        // ponta bífida
        ctx.beginPath();ctx.arc(cx2-3,py+ps*0.34+tLen,3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(cx2+3,py+ps*0.34+tLen,3,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
    }

    // ===== OLHOS SALIENTES melhorados =====
    const nightMode = phaseDef().night;
    // pupila dilata à noite
    const pupilW = nightMode ? 2.6 : 1.8;
    const pupilH = nightMode ? 5.0 : 4.0;

    [[px+7,py+5],[px+ps-7,py+5]].forEach(([ex,ey])=>{
        // protuberância ocular
        ctx.fillStyle="#007733";
        ctx.beginPath();ctx.arc(ex,ey,8,0,Math.PI*2);ctx.fill();

        // globo — base verde luminosa
        const eyeG=ctx.createRadialGradient(ex-1.5,ey-1.5,0,ex,ey,7);
        eyeG.addColorStop(0,"#55ffaa");eyeG.addColorStop(0.7,"#00bb55");eyeG.addColorStop(1,"#004d22");
        ctx.fillStyle=eyeG;ctx.shadowColor="#00ff88";ctx.shadowBlur=12;
        ctx.beginPath();ctx.arc(ex,ey,7,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;

        // íris dourada com detalhe de raios
        const iG=ctx.createRadialGradient(ex,ey,0,ex,ey,5.5);
        iG.addColorStop(0,"#ffe066");iG.addColorStop(0.4,"#cc8800");iG.addColorStop(1,"#5a3000");
        ctx.fillStyle=iG;ctx.beginPath();ctx.arc(ex,ey,5.5,0,Math.PI*2);ctx.fill();

        // raios da íris
        ctx.strokeStyle="rgba(80,40,0,0.3)"; ctx.lineWidth=0.7;
        for(let a=0;a<Math.PI*2;a+=Math.PI/5){
            ctx.beginPath();
            ctx.moveTo(ex+Math.cos(a)*2,ey+Math.sin(a)*2);
            ctx.lineTo(ex+Math.cos(a)*5,ey+Math.sin(a)*5);
            ctx.stroke();
        }

        // pupila vertical elíptica (dilata à noite)
        ctx.fillStyle="#000d00";
        ctx.save();ctx.translate(ex+0.5,ey+0.5);
        ctx.beginPath();ctx.ellipse(0,0,pupilW,pupilH,0,0,Math.PI*2);ctx.fill();
        ctx.restore();

        // brilho principal animado
        const bx=ex+2.5+Math.sin(game.tick*0.03)*0.5;
        const by=ey-2.5+Math.cos(game.tick*0.04)*0.5;
        ctx.fillStyle="rgba(255,255,255,0.9)";
        ctx.beginPath();ctx.arc(bx,by,1.8,0,Math.PI*2);ctx.fill();
        // brilho secundário pequeno
        ctx.fillStyle="rgba(255,255,255,0.35)";
        ctx.beginPath();ctx.arc(ex-2,ey+2,0.9,0,Math.PI*2);ctx.fill();

        // anel externo com borda neon
        ctx.strokeStyle="rgba(0,180,80,0.5)"; ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(ex,ey,7.5,0,Math.PI*2);ctx.stroke();
    });

    // narinas
    ctx.fillStyle="#004d1a";
    ctx.beginPath();ctx.ellipse(px+10,py+13,2,1.3,0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(px+ps-10,py+13,2,1.3,-0.3,0,Math.PI*2);ctx.fill();

    // sorriso
    ctx.strokeStyle="#005522";ctx.lineWidth=1.8;
    ctx.beginPath();
    if(jumping) ctx.arc(cx2,py+18,6,0.1,Math.PI-0.1);
    else        ctx.arc(cx2,py+15,4.5,0.25,Math.PI-0.25);
    ctx.stroke();

    ctx.restore();
}

/* --- Meta pulsante --- */
function drawMeta(){
    const t=game.tick;
    const pulse=0.07+Math.abs(Math.sin(t*0.05))*0.08;
    ctx.fillStyle=`rgba(0,255,136,${pulse})`;ctx.fillRect(0,0,CANVAS_W,ZONA.meta.y2);
    ctx.strokeStyle=`rgba(0,255,136,${0.4+Math.sin(t*0.08)*0.3})`;
    ctx.lineWidth=2;ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(0,ZONA.meta.y2);ctx.lineTo(CANVAS_W,ZONA.meta.y2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=`rgba(0,255,136,${0.7+Math.sin(t*0.1)*0.3})`;
    ctx.font="bold 14px Arial";ctx.textAlign="center";
    ctx.fillText("▲  M E T A  ▲",CANVAS_W/2,38);ctx.textAlign="left";
}

/* --- Neblina --- */
function drawFog(){
    const t=game.tick;
    for(let i=0;i<5;i++){
        const fx=((t*(0.3+i*0.15)+i*130)%(CANVAS_W+200))-100;
        const fy=100+(i*97)%500;
        const fr=80+Math.sin(t*0.02+i)*20;
        const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
        fg.addColorStop(0,"rgba(220,230,240,0.22)");fg.addColorStop(1,"rgba(220,230,240,0)");
        ctx.fillStyle=fg;ctx.beginPath();ctx.arc(fx,fy,fr,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="rgba(200,215,230,0.06)";ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
}

/* --- Noite --- */
function drawNight(){
    const ng=ctx.createLinearGradient(0,0,0,CANVAS_H);
    ng.addColorStop(0,"rgba(0,0,10,0.72)");ng.addColorStop(0.5,"rgba(0,0,8,0.55)");ng.addColorStop(1,"rgba(0,0,10,0.72)");
    ctx.fillStyle=ng;ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    game.cars.forEach(car=>{
        const goR=car.speed>0;
        const hx=goR?car.x+car.width:car.x;
        const hy=car.y+car.height/2;
        const lg=ctx.createRadialGradient(hx,hy,0,hx,hy,90);
        lg.addColorStop(0,"rgba(255,250,200,0.18)");lg.addColorStop(1,"rgba(255,250,200,0)");
        ctx.fillStyle=lg;ctx.beginPath();
        if(goR){ctx.moveTo(hx,hy);ctx.lineTo(hx+90,hy-30);ctx.lineTo(hx+90,hy+30);}
        else   {ctx.moveTo(hx,hy);ctx.lineTo(hx-90,hy-30);ctx.lineTo(hx-90,hy+30);}
        ctx.closePath();ctx.fill();
    });
    ctx.fillStyle="rgba(255,255,255,0.7)";
    for(let i=0;i<30;i++){
        const sr=0.5+Math.sin(game.tick*0.05+i)*0.4;
        ctx.beginPath();ctx.arc((i*73+17)%CANVAS_W,(i*47+11)%60,sr,0,Math.PI*2);ctx.fill();
    }
}

/* --- Label fase --- */
function drawPhaseLabel(def){
    if(!def) return;
    const alpha=Math.max(0,1-game.phaseTimer/120);
    if(alpha<=0) return;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.fillStyle="rgba(0,0,0,0.55)";
    ctx.beginPath();ctx.roundRect(CANVAS_W/2-130,CANVAS_H/2-24,260,46,10);ctx.fill();
    ctx.fillStyle="#00f7ff";ctx.font="bold 18px Arial";ctx.textAlign="center";
    ctx.shadowColor="#00f7ff";ctx.shadowBlur=12;
    ctx.fillText(def.label,CANVAS_W/2,CANVAS_H/2+7);
    ctx.shadowBlur=0;ctx.restore();
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
