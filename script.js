/* ================================================================
   QUASE PANQUECA — script.js
   Organização:
   1.  Referências ao DOM e ao canvas
   2.  Configuração por dificuldade
   3.  Estado global do jogo
   4.  Navegação entre telas
   5.  Inicialização e reinício
   6.  Geração dos carros por fase
   7.  Loop principal de animação
   8.  Funções de desenho (cenário, sapo, carros)
   9.  Movimentação dos carros
   10. Controles do jogador (teclado)
   11. Detecção de colisão (AABB)
   12. Verificação de vitória de fase
   13. Perder vida e game over
   14. Atualização do HUD
================================================================ */


/* ----------------------------------------------------------------
   1. REFERÊNCIAS AO DOM E AO CANVAS
   Pegamos os elementos HTML que vamos manipular durante o jogo.
   O `ctx` é o "contexto 2D" — é com ele que desenhamos no canvas.
---------------------------------------------------------------- */
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');

// Referências ao HUD
const elVidas = document.getElementById('vidas');
const elFase  = document.getElementById('faseAtual');


/* ----------------------------------------------------------------
   2. CONFIGURAÇÃO POR DIFICULDADE
   Cada nível define: velocidade base dos carros, quantidade de
   carros na pista e número total de fases para vencer.
   A velocidade aumenta automaticamente a cada fase.
---------------------------------------------------------------- */
const CONFIG = {
  facil: {
    velocidadeBase: 1.8,  // px por frame
    qtdCarros:      3,    // carros simultâneos na pista
    totalFases:     3     // fases para completar o jogo
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

// Faixas verticais (Y) onde os carros se movem — 7 faixas disponíveis
const FAIXAS_Y = [100, 160, 220, 280, 340, 400, 460];

// Cores de carro disponíveis — sorteadas aleatoriamente
const CORES_CARRO = ['#e63946', '#f4a261', '#457b9d', '#9b59b6', '#f5c518', '#e91e63'];


/* ----------------------------------------------------------------
   3. ESTADO GLOBAL DO JOGO
   Todas as variáveis que mudam durante a partida ficam aqui.
   São resetadas a cada novo jogo pela função iniciarJogo().
---------------------------------------------------------------- */
let sapo;          // objeto com posição e tamanho do sapo
let carros;        // array de objetos de carro
let vidas;         // quantas vidas restam (começa em 3)
let fase;          // fase atual (começa em 1)
let dificuldade;   // string: 'facil' | 'medio' | 'dificil'
let jogoRodando;   // boolean — false pausa o loop
let animacaoId;    // ID do requestAnimationFrame (para cancelar)
let cooldownDano;  // impede múltiplas colisões no mesmo frame


/* ----------------------------------------------------------------
   4. NAVEGAÇÃO ENTRE TELAS
   mostrarTela(id) esconde todas as telas e exibe apenas a do id.
   Isso evita CSS complicado — basta manipular a classe .oculto.
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

// Botão "Menu Principal" nas telas de resultado
function irParaMenu() {
  pararLoop();
  mostrarTela('menuPrincipal');
}

// Botão "Jogar de Novo" repete com a mesma dificuldade
function reiniciarJogo() {
  iniciarJogo(dificuldade);
}


/* ----------------------------------------------------------------
   5. INICIALIZAÇÃO DO JOGO
   Chamada pelo clique nos botões de dificuldade do menu.
   Configura o estado inicial e inicia o loop de animação.
---------------------------------------------------------------- */
function iniciarJogo(nivel) {
  dificuldade  = nivel;
  vidas        = 3;
  fase         = 1;
  jogoRodando  = true;
  cooldownDano = false;

  // Posição inicial do sapo: centro horizontal, parte inferior
  sapo = {
    x:       canvas.width / 2 - 20, // centralizado (largura 40px)
    y:       510,                    // próximo ao fundo (grama)
    largura: 40,
    altura:  40,
    passo:   50  // quantos pixels o sapo anda por tecla pressionada
  };

  gerarCarros();        // cria os carros da fase 1
  atualizarHUD();       // mostra ❤️❤️❤️ e "Fase 1"
  mostrarTela('telaJogo');

  pararLoop();          // cancela qualquer loop anterior (segurança)
  loopJogo();           // inicia o loop de animação
}


/* ----------------------------------------------------------------
   6. GERAÇÃO DOS CARROS
   Cria o array `carros` com base na dificuldade e na fase atual.
   A velocidade sobe 15% a cada fase (fator de progressão).
   Carros em faixas pares vão para direita, ímpares para esquerda.
---------------------------------------------------------------- */
function gerarCarros() {
  const cfg           = CONFIG[dificuldade];
  const fatorFase     = 1 + (fase - 1) * 0.15; // +15% por fase
  const velocidadeFase = cfg.velocidadeBase * fatorFase;

  carros = [];

  for (let i = 0; i < cfg.qtdCarros; i++) {
    const faixaY  = FAIXAS_Y[i % FAIXAS_Y.length]; // distribui nas faixas
    const direcao = i % 2 === 0 ? 1 : -1;           // alterna esquerda/direita
    const cor     = CORES_CARRO[i % CORES_CARRO.length];

    // Espaçamento inicial: distribui os carros ao longo da largura do canvas
    const xInicial = (canvas.width / cfg.qtdCarros) * i + Math.random() * 80;

    carros.push({
      x:         xInicial,
      y:         faixaY,
      largura:   65,
      altura:    34,
      velocidade: velocidadeFase * direcao,
      cor:       cor
    });
  }
}


/* ----------------------------------------------------------------
   7. LOOP PRINCIPAL DE ANIMAÇÃO
   requestAnimationFrame chama loopJogo ~60x por segundo.
   Cada "frame" segue a sequência: limpar → atualizar → desenhar.
---------------------------------------------------------------- */
function loopJogo() {
  if (!jogoRodando) return;

  // Limpa o canvas inteiro antes de desenhar o próximo frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sequência de atualização e desenho
  desenharCenario();
  moverCarros();
  desenharCarros();
  desenharSapo();
  verificarColisao();
  verificarVitoriaDeFase();

  // Agenda o próximo frame e guarda o ID (para poder cancelar)
  animacaoId = requestAnimationFrame(loopJogo);
}

// Para o loop de animação com segurança
function pararLoop() {
  jogoRodando = false;
  if (animacaoId) {
    cancelAnimationFrame(animacaoId);
    animacaoId = null;
  }
}


/* ----------------------------------------------------------------
   8. FUNÇÕES DE DESENHO
   Tudo é desenhado no canvas com o `ctx` (contexto 2D).
   Principais métodos:
     ctx.fillStyle   — define a cor de preenchimento
     ctx.fillRect(x, y, largura, altura) — desenha um retângulo
     ctx.fillText(texto, x, y)           — escreve texto
     ctx.beginPath() / ctx.arc()         — formas arredondadas
---------------------------------------------------------------- */

// Desenha o fundo: grama de início, estrada com faixas, grama de chegada
function desenharCenario() {
  // --- GRAMA DE CHEGADA (topo) ---
  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, 0, canvas.width, 80);

  // Texto de destino
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font      = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏁  CHEGADA', canvas.width / 2, 48);

  // --- ESTRADA ---
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 80, canvas.width, 450);

  // Faixas tracejadas da estrada
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let faixaY = 80; faixaY < 530; faixaY += 60) {
    // Cada faixa tracejada: blocos de 30px com espaço de 20px
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.fillRect(x, faixaY, 30, 3);
    }
  }

  // --- GRAMA DE INÍCIO (baixo) ---
  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, 530, canvas.width, 30);

  // Pequenas variações de cor na grama (decoração)
  ctx.fillStyle = '#3a7a22';
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.fillRect(x, 530, 20, 30);
  }

  ctx.textAlign = 'left'; // reset do alinhamento
}

// Desenha o sapo como um círculo verde com olhos
function desenharSapo() {
  const cx = sapo.x + sapo.largura / 2;  // centro X
  const cy = sapo.y + sapo.altura / 2;   // centro Y
  const r  = sapo.largura / 2;           // raio do corpo

  // Corpo principal
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Borda escura do corpo
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Olho esquerdo
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Pupila esquerda
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 10, cy - 8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Olho direito
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Pupila direita
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

// Desenha todos os carros como retângulos coloridos com janelas
function desenharCarros() {
  for (const carro of carros) {
    // Corpo do carro
    ctx.fillStyle = carro.cor;
    ctx.beginPath();
    // Retângulo com cantos arredondados (manualmente)
    roundRect(ctx, carro.x, carro.y, carro.largura, carro.altura, 6);
    ctx.fill();

    // Para-brisa (janela)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(carro.x + 8, carro.y + 4, carro.largura - 16, carro.altura - 14);

    // Rodas
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(carro.x + 10,              carro.y + carro.altura - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carro.x + carro.largura - 10, carro.y + carro.altura - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Auxiliar: desenha retângulo com cantos arredondados
// (não existe nativamente no canvas simples)
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
   A cada frame, somamos a velocidade à posição X do carro.
   Quando sai pela borda direita, reaparece pela esquerda, e
   vice-versa (efeito "wraparound" ou tela contínua).
---------------------------------------------------------------- */
function moverCarros() {
  for (const carro of carros) {
    carro.x += carro.velocidade;

    // Saiu pela direita → reaparece pela esquerda
    if (carro.x > canvas.width + 10) {
      carro.x = -carro.largura;
    }

    // Saiu pela esquerda → reaparece pela direita
    if (carro.x < -carro.largura - 10) {
      carro.x = canvas.width;
    }
  }
}


/* ----------------------------------------------------------------
   10. CONTROLES DO JOGADOR
   Escutamos o evento 'keydown' no documento inteiro.
   O sapo se move em "passos" discretos (não suave), como no
   jogo original Frogger.
   moverSapo() também é chamado pelos botões touch no HTML.
---------------------------------------------------------------- */
document.addEventListener('keydown', (evento) => {
  if (!jogoRodando) return;
  moverSapo(evento.key);
});

function moverSapo(tecla) {
  if (!jogoRodando) return;

  const p = sapo.passo; // atalho: quantos px por movimento

  if (tecla === 'ArrowUp')    sapo.y -= p;
  if (tecla === 'ArrowDown')  sapo.y += p;
  if (tecla === 'ArrowLeft')  sapo.x -= p;
  if (tecla === 'ArrowRight') sapo.x += p;

  // Impede o sapo de sair pelas bordas laterais
  sapo.x = Math.max(0, Math.min(canvas.width - sapo.largura, sapo.x));

  // Impede o sapo de sair pelas bordas verticais
  sapo.y = Math.max(0, Math.min(canvas.height - sapo.altura, sapo.y));
}


/* ----------------------------------------------------------------
   11. DETECÇÃO DE COLISÃO (AABB)
   AABB = Axis-Aligned Bounding Box.
   Verifica se os retângulos do sapo e de cada carro se sobrepõem.
   Para dois retângulos A e B se sobreporem, TODAS as 4 condições
   abaixo precisam ser verdadeiras ao mesmo tempo:
     A.x < B.x + B.largura   (A não está totalmente à direita de B)
     A.x + A.largura > B.x   (A não está totalmente à esquerda de B)
     A.y < B.y + B.altura    (A não está totalmente abaixo de B)
     A.y + A.altura > B.y    (A não está totalmente acima de B)
   Se qualquer uma for falsa, não há colisão.
---------------------------------------------------------------- */
function verificarColisao() {
  if (cooldownDano) return; // ignora enquanto estiver em cooldown

  // Hitbox do sapo levemente menor que o sprite (mais justo ao jogador)
  const margem = 8;
  const sx = sapo.x + margem;
  const sy = sapo.y + margem;
  const sl = sapo.largura  - margem * 2;
  const sa = sapo.altura   - margem * 2;

  for (const carro of carros) {
    const bateu =
      sx     < carro.x + carro.largura  &&  // sapo não passou da borda direita do carro
      sx + sl > carro.x                 &&  // sapo não está antes da borda esquerda
      sy     < carro.y + carro.altura   &&  // sapo não está abaixo do carro
      sy + sa > carro.y;                    // sapo não está acima do carro

    if (bateu) {
      perderVida();
      break; // uma colisão por frame é suficiente
    }
  }
}


/* ----------------------------------------------------------------
   12. VERIFICAÇÃO DE VITÓRIA DE FASE
   O sapo vence a fase quando alcança a grama do topo (y < 50).
   Se era a última fase → vitória total.
   Senão → avança de fase, gera novos carros mais rápidos.
---------------------------------------------------------------- */
function verificarVitoriaDeFase() {
  if (sapo.y > 50) return; // ainda não chegou no topo

  const cfg = CONFIG[dificuldade];
  fase++;

  if (fase > cfg.totalFases) {
    // Todas as fases completas → vitória!
    pararLoop();
    mostrarTela('telaVitoria');
  } else {
    // Próxima fase: reseta sapo e gera carros mais rápidos
    sapo.x = canvas.width / 2 - 20;
    sapo.y = 510;
    gerarCarros();   // usa a variável `fase` que já foi incrementada
    atualizarHUD();
    flashFase();     // pisca indicador de fase no canvas
  }
}

// Exibe brevemente "FASE X" no centro do canvas ao avançar de fase
function flashFase() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle   = '#f5c518';
  ctx.font        = 'bold 48px Arial';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`FASE ${fase}`, canvas.width / 2, canvas.height / 2);

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}


/* ----------------------------------------------------------------
   13. PERDER VIDA E GAME OVER
   Ao colidir: decrementa vidas, reseta posição do sapo e ativa
   cooldown para evitar múltiplas perdas no mesmo instante.
   Se vidas chegar a 0 → exibe tela de game over.
---------------------------------------------------------------- */
function perderVida() {
  vidas--;
  atualizarHUD();

  // Efeito visual: pisca o canvas de vermelho
  canvas.classList.add('dano');
  setTimeout(() => canvas.classList.remove('dano'), 400);

  if (vidas <= 0) {
    // Pequeno delay para o jogador ver o que aconteceu
    setTimeout(() => {
      pararLoop();
      mostrarTela('telaGameOver');
    }, 400);
    return;
  }

  // Volta o sapo ao início com cooldown para não perder vidas em sequência
  sapo.x       = canvas.width / 2 - 20;
  sapo.y       = 510;
  cooldownDano = true;

  // Cooldown de 1 segundo de invencibilidade
  setTimeout(() => { cooldownDano = false; }, 1000);
}


/* ----------------------------------------------------------------
   14. ATUALIZAÇÃO DO HUD
   Sincroniza os elementos HTML do HUD com o estado atual do jogo.
   Coração cheio ❤️ por vida restante, número da fase à direita.
---------------------------------------------------------------- */
function atualizarHUD() {
  // Exibe N corações = N vidas restantes
  elVidas.textContent = '❤️'.repeat(Math.max(0, vidas));

  // Número da fase (limitado ao total de fases da dificuldade)
  const cfg       = CONFIG[dificuldade];
  const faseExibir = Math.min(fase, cfg.totalFases);
  elFase.textContent = `${faseExibir} / ${cfg.totalFases}`;
}
