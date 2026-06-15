/* ================================================================
   QUASE PANQUECA — script.js
================================================================ */


/* ----------------------------------------------------------------
   1. REFERÊNCIAS AO DOM E AO CANVAS
---------------------------------------------------------------- */
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');

const elVidas = document.getElementById('vidas');
const elFase  = document.getElementById('faseAtual');


/* ----------------------------------------------------------------
   2. CONFIGURAÇÃO POR DIFICULDADE
---------------------------------------------------------------- */
const CONFIG = {
  facil: {
    velocidadeBase: 1.8,
    qtdCarros:      3,
    totalFases:     3
  },
  medio: {
    velocidadeBase: 3.0,
    qtdCarros:      5,
    totalFases:     5
  },
  dificil: {
    velocidadeBase: 5.0,
    qtdCarros:      7,
    totalFases:     7
  }
};

const FAIXAS_Y    = [100, 160, 220, 280, 340, 400, 460];
const CORES_CARRO = ['#e63946', '#f4a261', '#457b9d', '#9b59b6', '#f5c518', '#e91e63'];


/* ----------------------------------------------------------------
   3. ESTADO GLOBAL DO JOGO
---------------------------------------------------------------- */
let sapo;
let carros;
let vidas;
let fase;
let dificuldade;
let jogoRodando;
let animacaoId;
let cooldownDano;


/* ----------------------------------------------------------------
   4. NAVEGAÇÃO ENTRE TELAS
---------------------------------------------------------------- */
function mostrarTela(id) {
  const telas = ['menuPrincipal', 'telaJogo', 'telaGameOver', 'telaVitoria'];
  telas.forEach(nomeId => {
    const el = document.getElementById(nomeId);
    if (nomeId === id) {
      el.classList.remove('oculto');
    } else {
      el.classList.add('oculto');
    }
  });
}

function irParaMenu() {
  pararLoop();
  mostrarTela('menuPrincipal');
}

function reiniciarJogo() {
  iniciarJogo(dificuldade);
}


/* ----------------------------------------------------------------
   5. INICIALIZAÇÃO DO JOGO
---------------------------------------------------------------- */
function iniciarJogo(nivel) {
   alert("iniciar jogo rodou");
   
  dificuldade  = nivel;
  vidas        = 3;
  fase         = 1;
  jogoRodando  = true;
  cooldownDano = false;

  sapo = {
    x:       canvas.width / 2 - 20,
    y:       510,
    largura: 40,
    altura:  40,
    passo:   50
  };

  gerarCarros();
  atualizarHUD();
  mostrarTela('telaJogo');

  pararLoop();
  loopJogo();
}


/* ----------------------------------------------------------------
   6. GERAÇÃO DOS CARROS
---------------------------------------------------------------- */
function gerarCarros() {
  const cfg            = CONFIG[dificuldade];
  const fatorFase      = 1 + (fase - 1) * 0.15;
  const velocidadeFase = cfg.velocidadeBase * fatorFase;

  carros = [];

  for (let i = 0; i < cfg.qtdCarros; i++) {
    const faixaY  = FAIXAS_Y[i % FAIXAS_Y.length];
    const direcao = i % 2 === 0 ? 1 : -1;
    const cor     = CORES_CARRO[i % CORES_CARRO.length];
    const xInicial = (canvas.width / cfg.qtdCarros) * i + Math.random() * 80;

    carros.push({
      x:          xInicial,
      y:          faixaY,
      largura:    65,
      altura:     34,
      velocidade: velocidadeFase * direcao,
      cor:        cor
    });
  }
}


/* ----------------------------------------------------------------
   7. LOOP PRINCIPAL DE ANIMAÇÃO
---------------------------------------------------------------- */
function loopJogo() {
  if (!jogoRodando) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  desenharCenario();
  moverCarros();
  desenharCarros();   // ← FIX: carros agora aparecem (beginPath corrigido)
  desenharSapo();
  verificarColisao();
  verificarVitoriaDeFase();

  animacaoId = requestAnimationFrame(loopJogo);
}

function pararLoop() {
  jogoRodando = false;
  if (animacaoId) {
    cancelAnimationFrame(animacaoId);
    animacaoId = null;
  }
}


/* ----------------------------------------------------------------
   8. FUNÇÕES DE DESENHO
---------------------------------------------------------------- */
function desenharCenario() {
  // Grama de chegada (topo)
  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, 0, canvas.width, 80);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font      = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏁  CHEGADA', canvas.width / 2, 48);

  // Estrada
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 80, canvas.width, 450);

  // Faixas tracejadas
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let faixaY = 80; faixaY < 530; faixaY += 60) {
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.fillRect(x, faixaY, 30, 3);
    }
  }

  // Grama de início (baixo)
  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, 530, canvas.width, 30);

  ctx.fillStyle = '#3a7a22';
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.fillRect(x, 530, 20, 30);
  }

  ctx.textAlign = 'left';
}

function desenharSapo() {
  const cx = sapo.x + sapo.largura / 2;
  const cy = sapo.y + sapo.altura / 2;
  const r  = sapo.largura / 2;

  // Corpo
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Olho esquerdo
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Olho direito
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Sorriso
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 8, 0, Math.PI);
  ctx.stroke();
}

function desenharCarros() {
  for (const carro of carros) {
    // FIX PRINCIPAL: beginPath() antes de roundRect evita que os carros
    // "herdem" o caminho de desenhos anteriores e nunca apareçam
    ctx.beginPath();
    ctx.fillStyle = carro.cor;
    roundRect(ctx, carro.x, carro.y, carro.largura, carro.altura, 6);
    ctx.fill();

    // Para-brisa
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(carro.x + 8, carro.y + 4, carro.largura - 16, carro.altura - 14);

    // Rodas
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(carro.x + 10, carro.y + carro.altura - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(carro.x + carro.largura - 10, carro.y + carro.altura - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Auxiliar: retângulo com cantos arredondados
function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}


/* ----------------------------------------------------------------
   9. MOVIMENTAÇÃO DOS CARROS
---------------------------------------------------------------- */
function moverCarros() {
  for (const carro of carros) {
    carro.x += carro.velocidade;

    if (carro.x > canvas.width + 10)      carro.x = -carro.largura;
    if (carro.x < -carro.largura - 10)    carro.x = canvas.width;
  }
}


/* ----------------------------------------------------------------
   10. CONTROLES DO JOGADOR
---------------------------------------------------------------- */
document.addEventListener('keydown', (evento) => {
  if (!jogoRodando) return;
  moverSapo(evento.key);
});

function moverSapo(tecla) {
  if (!jogoRodando) return;

  const p = sapo.passo;

  if (tecla === 'ArrowUp')    sapo.y -= p;
  if (tecla === 'ArrowDown')  sapo.y += p;
  if (tecla === 'ArrowLeft')  sapo.x -= p;
  if (tecla === 'ArrowRight') sapo.x += p;

  // Limita às bordas do canvas
  sapo.x = Math.max(0, Math.min(canvas.width  - sapo.largura, sapo.x));
  sapo.y = Math.max(0, Math.min(canvas.height - sapo.altura,  sapo.y));
}


/* ----------------------------------------------------------------
   11. DETECÇÃO DE COLISÃO (AABB)
---------------------------------------------------------------- */
function verificarColisao() {
  if (cooldownDano) return;

  const margem = 8;
  const sx = sapo.x + margem;
  const sy = sapo.y + margem;
  const sl = sapo.largura  - margem * 2;
  const sa = sapo.altura   - margem * 2;

  for (const carro of carros) {
    const bateu =
      sx      < carro.x + carro.largura &&
      sx + sl > carro.x                 &&
      sy      < carro.y + carro.altura  &&
      sy + sa > carro.y;

    if (bateu) {
      perderVida();
      break;
    }
  }
}


/* ----------------------------------------------------------------
   12. VERIFICAÇÃO DE VITÓRIA DE FASE
   FIX: condição corrigida de `sapo.y > 50` para `sapo.y < 50`
   (o sapo precisa SUBIR até o topo, não descer)
---------------------------------------------------------------- */
function verificarVitoriaDeFase() {
  if (sapo.y >= 50) return; // ainda não chegou no topo

  const cfg = CONFIG[dificuldade];
  fase++;

  if (fase > cfg.totalFases) {
    pararLoop();
    mostrarTela('telaVitoria');
  } else {
    sapo.x = canvas.width / 2 - 20;
    sapo.y = 510;
    gerarCarros();
    atualizarHUD();
    flashFase();
  }
}

function flashFase() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle    = '#f5c518';
  ctx.font         = 'bold 48px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`FASE ${fase}`, canvas.width / 2, canvas.height / 2);

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}


/* ----------------------------------------------------------------
   13. PERDER VIDA E GAME OVER
---------------------------------------------------------------- */
function perderVida() {
  vidas--;
  atualizarHUD();

  canvas.classList.add('dano');
  setTimeout(() => canvas.classList.remove('dano'), 400);

  if (vidas <= 0) {
    setTimeout(() => {
      pararLoop();
      mostrarTela('telaGameOver');
    }, 400);
    return;
  }

  sapo.x       = canvas.width / 2 - 20;
  sapo.y       = 510;
  cooldownDano = true;

  setTimeout(() => { cooldownDano = false; }, 1000);
}


/* ----------------------------------------------------------------
   14. ATUALIZAÇÃO DO HUD
---------------------------------------------------------------- */
function atualizarHUD() {
  elVidas.textContent = '❤️'.repeat(Math.max(0, vidas));

  const cfg        = CONFIG[dificuldade];
  const faseExibir = Math.min(fase, cfg.totalFases);
  elFase.textContent = `${faseExibir} / ${cfg.totalFases}`;
}
