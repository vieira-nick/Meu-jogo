/* ================================================================
   QUASE PANQUECA — style.css
   Organização:
   1. Reset & variáveis globais
   2. Layout base (body + .tela + .oculto)
   3. Menu principal
   4. HUD do jogo
   5. Canvas
   6. Controles touch (mobile)
   7. Telas de resultado (game over / vitória)
   8. Animações
================================================================ */


/* ----------------------------------------------------------------
   1. RESET & VARIÁVEIS GLOBAIS
   Removemos margens padrão do navegador e definimos as cores
   do jogo como variáveis CSS para facilitar manutenção.
---------------------------------------------------------------- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Cores do ambiente */
  --cor-fundo:        #0d1f0d;
  --cor-grama:        #2d5a1b;
  --cor-grama-clara:  #3a7a22;
  --cor-pista:        #4a4a4a;
  --cor-faixa:        #f5c518;

  /* Cores do sapo e carros */
  --cor-sapo:         #4caf50;
  --cor-sapo-escuro:  #2e7d32;
  --cor-carro-1:      #e63946;
  --cor-carro-2:      #f4a261;
  --cor-carro-3:      #457b9d;
  --cor-carro-4:      #9b59b6;

  /* Cores da UI */
  --cor-texto:        #ffffff;
  --cor-texto-muted:  rgba(255,255,255,0.6);
  --cor-verde:        #4caf50;
  --cor-laranja:      #ff9800;
  --cor-vermelho:     #f44336;
  --cor-ouro:         #f5c518;

  /* Tipografia */
  --fonte-jogo:       'Segoe UI', 'Arial Rounded MT Bold', Arial, sans-serif;
}


/* ----------------------------------------------------------------
   2. LAYOUT BASE
   O body centra tudo com flexbox.
   .tela = container de cada tela do jogo.
   .oculto = esconde a tela completamente (usado pelo JS).
---------------------------------------------------------------- */
body {
  background-color: var(--cor-fundo);
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(45,90,27,0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(76,175,80,0.08) 0%, transparent 50%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--fonte-jogo);
  color: var(--cor-texto);
  overflow: hidden;
}

.tela {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  padding: 1rem;
}

/* Classe utilitária para esconder telas — usada pelo JS */
.oculto {
  display: none !important;
}


/* ----------------------------------------------------------------
   3. MENU PRINCIPAL
   Container central com título, emoji animado e botões de
   dificuldade. Cada botão tem cor distinta por nível.
---------------------------------------------------------------- */
.menu-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

/* Sapo animado do menu */
.logo-sapo {
  font-size: 72px;
  animation: sapoFlutua 2s ease-in-out infinite alternate;
  filter: drop-shadow(0 8px 20px rgba(76,175,80,0.4));
  line-height: 1;
}

.titulo-jogo {
  font-size: 42px;
  font-weight: 900;
  color: var(--cor-ouro);
  letter-spacing: -1px;
  text-shadow: 0 0 30px rgba(245,197,24,0.4);
}

.subtitulo {
  font-size: 15px;
  color: var(--cor-texto-muted);
  letter-spacing: 0.5px;
}

.separador {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cor-ouro), transparent);
  margin: 4px 0;
}

.label-dificuldade {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--cor-texto-muted);
}

/* Grid dos 3 botões de dificuldade */
.botoes-dificuldade {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-dificuldade {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border: 2px solid transparent;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  color: var(--cor-texto);
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, border-color 0.15s;
  font-family: var(--fonte-jogo);
}

.btn-dificuldade:hover {
  transform: translateY(-3px);
  background: rgba(255,255,255,0.12);
}

.btn-dificuldade:active {
  transform: translateY(0) scale(0.97);
}

.btn-icone  { font-size: 28px; }
.btn-texto  { font-size: 16px; font-weight: 700; }
.btn-desc   { font-size: 11px; color: var(--cor-texto-muted); }

/* Cores individuais por dificuldade */
.btn-facil:hover   { border-color: var(--cor-verde); }
.btn-medio:hover   { border-color: var(--cor-laranja); }
.btn-dificil:hover { border-color: var(--cor-vermelho); }

.btn-facil .btn-texto   { color: var(--cor-verde); }
.btn-medio .btn-texto   { color: var(--cor-laranja); }
.btn-dificil .btn-texto { color: var(--cor-vermelho); }

.instrucoes {
  font-size: 12px;
  color: var(--cor-texto-muted);
  margin-top: 4px;
}


/* ----------------------------------------------------------------
   4. HUD DO JOGO
   Barra acima do canvas com vidas (coração) e número da fase.
   Usa flexbox para separar os itens nas extremidades.
---------------------------------------------------------------- */
#hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 500px;
  padding: 10px 16px;
  background: rgba(0,0,0,0.7);
  border-radius: 12px 12px 0 0;
  backdrop-filter: blur(4px);
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hud-direita {
  align-items: flex-end;
}

.hud-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--cor-texto-muted);
}

/* Vidas (corações emoji) */
#vidas {
  font-size: 18px;
  letter-spacing: 2px;
}

/* Número da fase */
#faseAtual {
  font-size: 22px;
  font-weight: 900;
  color: var(--cor-ouro);
}

.hud-titulo {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--cor-texto-muted);
  font-weight: 700;
}


/* ----------------------------------------------------------------
   5. CANVAS
   O elemento onde o jogo é renderizado pelo JavaScript.
   Fica colado ao HUD com bordas arredondadas apenas embaixo.
---------------------------------------------------------------- */
#canvas {
  display: block;
  border-radius: 0 0 12px 12px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top: none;
  /* Impede que o canvas fique borrado em telas de alta densidade */
  image-rendering: pixelated;
}


/* ----------------------------------------------------------------
   6. CONTROLES TOUCH (MOBILE)
   Botões direcionais exibidos abaixo do canvas em dispositivos
   com tela pequena. Ocultos em telas grandes (>520px).
---------------------------------------------------------------- */
#controles-touch {
  display: none; /* escondido por padrão */
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.touch-row {
  display: flex;
  gap: 6px;
}

.touch-btn {
  width: 56px;
  height: 56px;
  font-size: 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  color: var(--cor-texto);
  cursor: pointer;
  transition: background 0.1s, transform 0.1s;
  font-family: var(--fonte-jogo);
}

.touch-btn:active {
  background: rgba(255,255,255,0.25);
  transform: scale(0.93);
}

/* Mostra os controles em telas pequenas */
@media (max-width: 520px) {
  #controles-touch { display: flex; }
  #hud, #canvas { width: 100%; }
}


/* ----------------------------------------------------------------
   7. TELAS DE RESULTADO (GAME OVER / VITÓRIA)
   Layout centralizado com ícone grande, título e dois botões.
   Derrota usa cor vermelha, vitória usa dourado.
---------------------------------------------------------------- */
.resultado-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 32px;
  background: rgba(0,0,0,0.6);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  max-width: 380px;
  width: 100%;
}

.resultado-icone {
  font-size: 72px;
  animation: resultadoEntrada 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.resultado-titulo {
  font-size: 32px;
  font-weight: 900;
}

.resultado-desc {
  font-size: 15px;
  color: var(--cor-texto-muted);
  line-height: 1.6;
}

/* Cores de destaque por resultado */
.resultado-derrota .resultado-titulo { color: var(--cor-vermelho); }
.resultado-derrota {
  border-color: rgba(244,67,54,0.3);
  box-shadow: 0 0 40px rgba(244,67,54,0.1);
}

.resultado-vitoria .resultado-titulo { color: var(--cor-ouro); }
.resultado-vitoria {
  border-color: rgba(245,197,24,0.3);
  box-shadow: 0 0 40px rgba(245,197,24,0.15);
}

.resultado-botoes {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
}

.btn-resultado {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--fonte-jogo);
  transition: transform 0.1s, filter 0.1s;
}

.btn-resultado:hover  { filter: brightness(1.1); transform: translateY(-1px); }
.btn-resultado:active { transform: scale(0.97); }

/* Botão principal: cor vibrante */
.btn-tentar { background: var(--cor-verde); color: #fff; }
.resultado-derrota .btn-tentar { background: var(--cor-vermelho); }
.resultado-vitoria .btn-tentar { background: var(--cor-ouro); color: #000; }

/* Botão secundário: neutro */
.btn-menu {
  background: rgba(255,255,255,0.1);
  color: var(--cor-texto);
  border: 1px solid rgba(255,255,255,0.2);
}


/* ----------------------------------------------------------------
   8. ANIMAÇÕES
   sapoFlutua  — sapo flutuando no menu
   piscar      — pulsação suave do título
   resultadoEntrada — entrada do ícone de resultado
   dano        — pisca o canvas ao levar dano (classe adicionada via JS)
---------------------------------------------------------------- */

@keyframes sapoFlutua {
  from { transform: translateY(0px); }
  to   { transform: translateY(-12px); }
}

@keyframes piscar {
  from { opacity: 1; }
  to   { opacity: 0.65; }
}

@keyframes resultadoEntrada {
  from { transform: scale(0) rotate(-20deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg);  opacity: 1; }
}

/* Piscada vermelha no canvas ao levar dano */
@keyframes danoCanvas {
  0%   { box-shadow: 0 0 0 0 rgba(244,67,54,0); }
  30%  { box-shadow: 0 0 0 8px rgba(244,67,54,0.7); }
  100% { box-shadow: 0 0 0 0 rgba(244,67,54,0); }
}

#canvas.dano {
  animation: danoCanvas 0.4s ease-out;
}
