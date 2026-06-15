```javascript
/* ============================
   ESTADO DO JOGO
============================ */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const game = {
    running: false,
    level: 1,
    lives: 3,
    difficulty: "easy",
    maxLevel: 7,

    player: {
        x: 220,
        y: 580,
        size: 30,
        step: 40
    },

    cars: [],
    logs: []
};


/* ============================
   ELEMENTOS HTML
============================ */

const levelText = document.getElementById("level");
const livesText = document.getElementById("lives");


/* ============================
   CONFIG
============================ */

const difficultyConfig = {
    easy: 2,
    medium: 3,
    hard: 5
};


/* ============================
   INICIAR JOGO
============================ */

function startGame(mode){

    game.difficulty = mode;
    game.level = 1;
    game.lives = 3;
    game.running = true;

    resetPlayer();
    createObjects();
    updateHUD();

    showScreen("gameScreen");

    gameLoop();
}


/* ============================
   TELAS
============================ */

function showScreen(id){

    document.querySelectorAll(".screen")
        .forEach(screen => screen.classList.add("hidden"));

    document.getElementById(id)
        .classList.remove("hidden");
}

function goMenu(){

    game.running = false;
    showScreen("menu");
}

function restartGame(){

    startGame(game.difficulty);
}


/* ============================
   LOOP PRINCIPAL
============================ */

function gameLoop(){

    if(!game.running) return;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}


/* ============================
   UPDATE
============================ */

function update(){

    moveCars();

    if(game.level >= 4){
        moveLogs();
        checkWater();
    }

    checkCollision();
    checkVictory();
}


/* ============================
   DESENHO
============================ */

function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawBackground();

    if(game.level >= 4){
        drawRiver();
        drawLogs();
    }

    drawRoad();
    drawCars();
    drawPlayer();
}


/* ============================
   FUNDO
============================ */

function drawBackground(){

    ctx.fillStyle = "#05131f";
    ctx.fillRect(0,0,480,640);

    ctx.strokeStyle = "#00f7ff";

    for(let i=0;i<640;i+=40){

        ctx.beginPath();
        ctx.moveTo(0,i);
        ctx.lineTo(480,i);
        ctx.stroke();
    }
}


/* ============================
   ESTRADA
============================ */

function drawRoad(){

    ctx.fillStyle = "#222";

    ctx.fillRect(0,280,480,220);

    ctx.strokeStyle = "#ff00d4";

    for(let i=0;i<480;i+=40){

        ctx.beginPath();
        ctx.moveTo(i,390);
        ctx.lineTo(i+20,390);
        ctx.stroke();
    }
}


/* ============================
   RIO
============================ */

function drawRiver(){

    ctx.fillStyle = "#003566";
    ctx.fillRect(0,80,480,140);
}


/* ============================
   SAPO
============================ */

function drawPlayer(){

    let p = game.player;

    ctx.fillStyle = "#00ff88";

    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;

    ctx.fillRect(
        p.x,
        p.y,
        p.size,
        p.size
    );

    ctx.shadowBlur = 0;
}


/* ============================
   CARROS
============================ */

function createCars(){

    game.cars = [];

    let amount = 3 + game.level;

    for(let i=0;i<amount;i++){

        game.cars.push({

            x: Math.random()*480,
            y: 300 + (i%4)*45,

            width: 50,
            height: 25,

            speed: difficultyConfig[game.difficulty]
                    + Math.random()*2,

            color: ["#ff006e","#ffbe0b","#8338ec"][i%3]
        });
    }
}

function drawCars(){

    game.cars.forEach(car=>{

        ctx.fillStyle = car.color;

        ctx.shadowColor = car.color;
        ctx.shadowBlur = 12;

        ctx.fillRect(
            car.x,
            car.y,
            car.width,
            car.height
        );

        ctx.shadowBlur = 0;
    });
}

function moveCars(){

    game.cars.forEach(car=>{

        car.x += car.speed;

        if(car.x > 500){

            car.x = -60;
        }
    });
}


/* ============================
   TRONCOS
============================ */

function createLogs(){

    game.logs = [];

    for(let i=0;i<4;i++){

        game.logs.push({

            x: i*130,
            y: 110 + (i%2)*60,

            width: 90,
            height: 25,

            speed: 1.5
        });
    }
}

function drawLogs(){

    game.logs.forEach(log=>{

        ctx.fillStyle = "#9c6644";

        ctx.fillRect(
            log.x,
            log.y,
            log.width,
            log.height
        );
    });
}

function moveLogs(){

    game.logs.forEach(log=>{

        log.x += log.speed;

        if(log.x > 500){

            log.x = -100;
        }
    });
}


/* ============================
   COLISÃO CARRO
============================ */

function checkCollision(){

    let p = game.player;

    game.cars.forEach(car=>{

        if(
            p.x < car.x + car.width &&
            p.x + p.size > car.x &&
            p.y < car.y + car.height &&
            p.y + p.size > car.y
        ){
            loseLife();
        }
    });
}


/* ============================
   ÁGUA
============================ */

function checkWater(){

    let p = game.player;

    if(p.y > 80 && p.y < 220){

        let safe = false;

        game.logs.forEach(log=>{

            if(
                p.x < log.x + log.width &&
                p.x + p.size > log.x &&
                p.y < log.y + log.height &&
                p.y + p.size > log.y
            ){
                safe = true;
                p.x += log.speed;
            }
        });

        if(!safe){

            loseLife();
        }
    }
}


/* ============================
   VIDAS
============================ */

function loseLife(){

    game.lives--;

    updateHUD();

    if(game.lives <= 0){

        game.running = false;
        showScreen("gameOver");
        return;
    }

    resetPlayer();
}


/* ============================
   VITÓRIA
============================ */

function checkVictory(){

    if(game.player.y <= 20){

        game.level++;

        if(game.level > game.maxLevel){

            game.running = false;
            showScreen("victory");
            return;
        }

        createObjects();
        resetPlayer();
        updateHUD();
    }
}


/* ============================
   OBJETOS
============================ */

function createObjects(){

    createCars();

    if(game.level >= 4){

        createLogs();
    }
}


/* ============================
   PLAYER
============================ */

function resetPlayer(){

    game.player.x = 220;
    game.player.y = 580;
}

function movePlayer(direction){

    if(!game.running) return;

    let p = game.player;
    let step = p.step;

    if(direction === "up") p.y -= step;
    if(direction === "down") p.y += step;
    if(direction === "left") p.x -= step;
    if(direction === "right") p.x += step;

    p.x = Math.max(0,Math.min(450,p.x));
    p.y = Math.max(0,Math.min(610,p.y));
}


/* ============================
   TECLADO
============================ */

document.addEventListener("keydown",(e)=>{

    if(e.key==="ArrowUp") movePlayer("up");
    if(e.key==="ArrowDown") movePlayer("down");
    if(e.key==="ArrowLeft") movePlayer("left");
    if(e.key==="ArrowRight") movePlayer("right");
});


/* ============================
   HUD
============================ */

function updateHUD(){

    levelText.textContent = game.level;

    livesText.textContent =
        "♥".repeat(game.lives);
}
```
