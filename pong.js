// ==========================================
// 1. CAPTURA DE ELEMENTOS DO HTML
// ==========================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const modeSelect = document.getElementById('modeSelect');

// Elementos de navegação e HUD externo
const howToPlayBtn = document.getElementById('howToPlayBtn');
const instructions = document.getElementById('instructions');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const hud = document.getElementById('hud');

const p1TeleportCD = document.getElementById('p1TeleportCD');
const p1FreezeCD = document.getElementById('p1FreezeCD');
const p2PowerHUD = document.getElementById('p2PowerHUD');
const p2TeleportCD = document.getElementById('p2TeleportCD');
const p2FreezeCD = document.getElementById('p2FreezeCD');

const checkPoderes = document.getElementById('checkPoderes');
const checkSons = document.getElementById('checkSons');

// ==========================================
// 2. VARIÁVEIS DE ESTADO DO JOGO
// ==========================================
let gameMode = 'medio';
let poderesAtivos = true;
let sonsAtivos = true;
let running = false; 

const paddleHeight = 80, paddleWidth = 10;
let leftY = (canvas.height - paddleHeight) / 2;
let rightY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballVX = 4, ballVY = 3;

let keys = {};
let scoreLeft = 0;
let scoreRight = 0;

// ==========================================
// 3. CONFIGURAÇÕES DOS PODERES
// ==========================================
const cooldownTeleporte = 7500; // 7.5s
let lastTeleportLeft = 0;
let lastTeleportRight = 0;
let efeitosVisuais = []; 

// Mecânica do Novo Poder: Congelar
const cooldownFreeze = 11000; // 11s
const duracaoFreeze = 1500;    // 1.5s
let lastFreezeLeft = 0;
let lastFreezeRight = 0;
let isFrozen = false;
let freezeEndTime = 0;
let savedBallVX = 0;
let savedBallVY = 0;

// Web Audio API para efeitos sonoros básicos
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSomTeleporte() {
    if (!sonsAtivos) return; 
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1); 
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); 
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function desenharEfeitos() {
    for (let i = efeitosVisuais.length - 1; i >= 0; i--) {
        let efeito = efeitosVisuais[i];
        ctx.fillStyle = `rgba(0, 255, 255, ${efeito.alpha})`; 
        ctx.fillRect(efeito.x, efeito.y, paddleWidth, paddleHeight);
        efeito.alpha -= 0.05; 
        if (efeito.alpha <= 0) efeitosVisuais.splice(i, 1); 
    }
}

// ==========================================
// 4. LÓGICA DE INTELIGÊNCIA ARTIFICIAL
// ==========================================
function preverPosicaoY() {
  let distanciaX = (canvas.width - 20) - ballX; 
  let tempoAteChegar = distanciaX / ballVX;
  let yPrevisto = ballY + (ballVY * tempoAteChegar);

  while (yPrevisto < 0 || yPrevisto > canvas.height) {
    if (yPrevisto < 0) yPrevisto = Math.abs(yPrevisto); 
    if (yPrevisto > canvas.height) yPrevisto = canvas.height - (yPrevisto - canvas.height); 
  }
  return yPrevisto;
}

// ==========================================
// 5. MOTOR DO JOGO (UPDATE)
// ==========================================
function update() {
  if (!running) return;

  // --- CONTROLES DO JOGADOR 1 (W / S) ---
  if (keys['w'] || keys['W']) leftY -= 5;
  if (keys['s'] || keys['S']) leftY += 5;

  // Poder 1 - Teleporte P1 (Tecla E)
  if (poderesAtivos && (keys['e'] || keys['E'])) {
      let agora = Date.now();
      if (agora - lastTeleportLeft >= cooldownTeleporte) {
          efeitosVisuais.push({ x: 10, y: leftY, alpha: 0.8 }); 
          leftY = ballY - (paddleHeight / 2); 
          lastTeleportLeft = agora;
          tocarSomTeleporte();
      }
  }

  // Poder 2 - Congelar P1 (Tecla Q)
  if (poderesAtivos && (keys['q'] || keys['Q']) && !isFrozen) {
      let agora = Date.now();
      if (agora - lastFreezeLeft >= cooldownFreeze) {
          isFrozen = true;
          freezeEndTime = agora + duracaoFreeze;
          savedBallVX = ballVX;
          savedBallVY = ballVY;
          ballVX = 0;
          ballVY = 0;
          lastFreezeLeft = agora;
      }
  }

  // --- CONTROLE DA RAQUETE DIREITA (IA ou P2) ---
  if (gameMode === '2p'){
    if(keys['ArrowUp']) rightY -= 5;
    if(keys['ArrowDown']) rightY += 5;

    // Poder 1 - Teleporte P2 (Seta Esquerda)
    if (poderesAtivos && keys['ArrowLeft']) {
        let agora = Date.now();
        if (agora - lastTeleportRight >= cooldownTeleporte) {
            efeitosVisuais.push({ x: canvas.width - 20, y: rightY, alpha: 0.8 });
            rightY = ballY - (paddleHeight / 2);
            lastTeleportRight = agora;
            tocarSomTeleporte();
        }
    }

    // Poder 2 - Congelar P2 (Seta Direita)
    if (poderesAtivos && keys['ArrowRight'] && !isFrozen) {
        let agora = Date.now();
        if (agora - lastFreezeRight >= cooldownFreeze) {
            isFrozen = true;
            freezeEndTime = agora + duracaoFreeze;
            savedBallVX = ballVX;
            savedBallVY = ballVY;
            ballVX = 0;
            ballVY = 0;
            lastFreezeRight = agora;
        }
    }
  } else {
    // Inteligência Artificial
    let iaSpeed = 0;
    let alvoY = canvas.height / 2;
    
    if(gameMode === 'facil'){
      iaSpeed = 2.5;
      alvoY = ballY; 
    } 
    else if(gameMode === 'medio'){
      iaSpeed = 4;
      alvoY = ballY;
    }
    else if(gameMode === 'dificil'){
      iaSpeed = 5.5; 
      if(ballVX > 0) alvoY = preverPosicaoY();
    }

    let centroRaqueteIA  = rightY + (paddleHeight / 2);
    if (centroRaqueteIA < alvoY - 10) rightY += iaSpeed; 
    else if (centroRaqueteIA > alvoY + 10) rightY -= iaSpeed;
  }

  // Gerenciamento do temporizador do congelamento
  if (isFrozen && Date.now() >= freezeEndTime) {
      isFrozen = false;
      ballVX = savedBallVX;
      ballVY = savedBallVY;
  }

  leftY = Math.max(0, Math.min(canvas.height - paddleHeight, leftY));
  rightY = Math.max(0, Math.min(canvas.height - paddleHeight, rightY));

  // Física da Bola
  ballX += ballVX;
  ballY += ballVY;

  if (ballY < 0 || ballY > canvas.height) ballVY *= -1;

  // --- SISTEMA DE COLISÃO REFORÇADO (Sem travar ou super acelerar) ---
  const aceleracao = 1.05; 
  const limiteVelocidade = 15; 

  if (ballX < 10 + paddleWidth && ballY > leftY && ballY < leftY + paddleHeight && ballVX < 0) {
    ballVX *= -1; 
    ballX = 10 + paddleWidth; 
    if (Math.abs(ballVX) < limiteVelocidade) {
        ballVX *= aceleracao;
        ballVY *= aceleracao;
    }
  }

  if (ballX > canvas.width - 10 - paddleWidth && ballY > rightY && ballY < rightY + paddleHeight && ballVX > 0) {
    ballVX *= -1; 
    ballX = canvas.width - 10 - paddleWidth; 
    if (Math.abs(ballVX) < limiteVelocidade) {
        ballVX *= aceleracao;
        ballVY *= aceleracao;
    }
  }

  // Placar e Reset
  if (ballX < 0) {
    scoreRight++;
    resetBall();
  } else if (ballX > canvas.width) {
    scoreLeft++;
    resetBall();
  }
}

// ==========================================
// 6. RENDERIZAÇÃO (DRAW)
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";

  // Elementos estáticos
  ctx.fillRect(10, leftY, paddleWidth, paddleHeight);
  ctx.fillRect(canvas.width - 20, rightY, paddleWidth, paddleHeight);
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);
  }

  // Bola
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Animação visual do Congelamento (Aura/Cristal de gelo ao redor da bola)
  if (isFrozen) {
      ctx.beginPath();
      ctx.arc(ballX, ballY, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 220, 255, 0.35)"; // Azul brilhante translúcido
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#a5f3fc"; // Borda ciano gelo
      ctx.stroke();
  }

  // Placar
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(scoreLeft, canvas.width / 4, 30);
  ctx.fillText(scoreRight, canvas.width * 3 / 4, 30);

  // --- ATUALIZAÇÃO DO PAINEL EXTERNO (HTML HUD COOLDOWNS) ---
  if (poderesAtivos) {
      let agora = Date.now();

      // Jogador 1 (Esquerda)
      let tLeft = Math.max(0, (cooldownTeleporte - (agora - lastTeleportLeft)) / 1000);
      let fLeft = Math.max(0, (cooldownFreeze - (agora - lastFreezeLeft)) / 1000);

      p1TeleportCD.innerText = tLeft > 0 ? `Teleporte (E): ${tLeft.toFixed(1)}s` : "Teleporte (E): PRONTO";
      p1TeleportCD.style.color = tLeft > 0 ? "#ff4d4d" : "#00ffff";
      p1FreezeCD.innerText = fLeft > 0 ? `Congelar (Q): ${fLeft.toFixed(1)}s` : "Congelar (Q): PRONTO";
      p1FreezeCD.style.color = fLeft > 0 ? "#ff4d4d" : "#38bdf8";

      // Jogador 2 (Direita)
      if (gameMode === '2p') {
          p2PowerHUD.style.display = "block";
          let tRight = Math.max(0, (cooldownTeleporte - (agora - lastTeleportRight)) / 1000);
          let fRight = Math.max(0, (cooldownFreeze - (agora - lastFreezeRight)) / 1000);

          p2TeleportCD.innerText = tRight > 0 ? `Teleporte (◀): ${tRight.toFixed(1)}s` : "Teleporte (◀): PRONTO";
          p2TeleportCD.style.color = tRight > 0 ? "#ff4d4d" : "#00ffff";
          p2FreezeCD.innerText = fRight > 0 ? `Congelar (▶): ${fRight.toFixed(1)}s` : "Congelar (▶): PRONTO";
          p2FreezeCD.style.color = fRight > 0 ? "#ff4d4d" : "#38bdf8";
      } else {
          p2PowerHUD.style.display = "none";
      }
  }

  desenharEfeitos();
}

function resetBall() {
  isFrozen = false; // Garante o descongelamento em caso de ponto simultâneo
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballVX = 4 * (Math.random() > 0.5 ? 1 : -1);
  ballVY = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function loop() {
  update();
  if (running) draw();
  requestAnimationFrame(loop);
}

// ==========================================
// 7. EVENTOS E TRATAMENTO DA INTERFACE
// ==========================================
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

howToPlayBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    instructions.style.display = 'block';
});

closeInstructionsBtn.addEventListener('click', () => {
    instructions.style.display = 'none';
    menu.style.display = 'block';
});

startBtn.addEventListener('click', () => {
  gameMode = modeSelect.value; 
  poderesAtivos = checkPoderes.checked; 
  sonsAtivos = checkSons.checked;       
  
  if (sonsAtivos && audioCtx.state === 'suspended') audioCtx.resume();

  menu.style.display = 'none';  
  canvas.style.display = 'block'; 
  backBtn.style.display = 'block'; 
  if (poderesAtivos) hud.style.display = 'block'; // Mostra o painel se os poderes estiverem ativos
  running = true; 
});

backBtn.addEventListener('click', () => {
  running = false; 
  menu.style.display = 'block'; 
  canvas.style.display = 'none'; 
  backBtn.style.display = 'none'; 
  hud.style.display = 'none'; // Esconde painel externo
  
  scoreLeft = 0; scoreRight = 0;
  resetBall();
  leftY = (canvas.height - paddleHeight) / 2;
  rightY = (canvas.height - paddleHeight) / 2;
  efeitosVisuais = [];
  lastTeleportLeft = 0; lastTeleportRight = 0;
  lastFreezeLeft = 0; lastFreezeRight = 0;
});

loop();