const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const modeSelect = document.getElementById('modeSelect');
const backBtn = document.getElementById('backBtn'); // Captura o novo botão

let gameMode = 'medio';

const paddleHeight = 80, paddleWidth = 10;
let leftY = (canvas.height - paddleHeight) / 2;
let rightY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballVX = 4, ballVY = 3;
let keys = {};

let scoreLeft = 0;
let scoreRight = 0;

let running = false; 

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";

  // Raquetes
  ctx.fillRect(10, leftY, paddleWidth, paddleHeight);
  ctx.fillRect(canvas.width - 20, rightY, paddleWidth, paddleHeight);

  // Linha central
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);
  }

  // Bola
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Placar
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(scoreLeft, canvas.width / 4, 30);
  ctx.fillText(scoreRight, canvas.width * 3 / 4, 30);
}

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

function update() {
  if (!running) return;

  if (keys['w'] || keys['W']) leftY -= 5;
  if (keys['s'] || keys['S']) leftY += 5;

  if (gameMode === '2p'){
    if(keys['ArrowUp']) rightY -= 5;
    if(keys['ArrowDown']) rightY += 5;
  } else {
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

  leftY = Math.max(0, Math.min(canvas.height - paddleHeight, leftY));
  rightY = Math.max(0, Math.min(canvas.height - paddleHeight, rightY));

  ballX += ballVX;
  ballY += ballVY;

  if (ballY < 0 || ballY > canvas.height) ballVY *= -1;

  if (ballX < 10 + paddleWidth && ballY > leftY && ballY < leftY + paddleHeight) ballVX *= -1;
  if (ballX > canvas.width - 10 - paddleWidth && ballY > rightY && ballY < rightY + paddleHeight) ballVX *= -1;

  if (ballX < 0) {
    scoreRight++;
    resetBall();
  } else if (ballX > canvas.width) {
    scoreLeft++;
    resetBall();
  }
}

function resetBall() {
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

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Iniciar Jogo
startBtn.addEventListener('click', () => {
  gameMode = modeSelect.value; 
  menu.style.display = 'none';  
  canvas.style.display = 'block'; 
  backBtn.style.display = 'block'; // Mostra o botão de voltar
  running = true; 
});

// Lógica de Voltar ao Menu
backBtn.addEventListener('click', () => {
  running = false; // Para o jogo
  menu.style.display = 'block'; // Mostra menu
  canvas.style.display = 'none'; // Esconde jogo
  backBtn.style.display = 'none'; // Esconde o próprio botão
  
  // Reseta o estado do jogo
  scoreLeft = 0;
  scoreRight = 0;
  resetBall();
  leftY = (canvas.height - paddleHeight) / 2;
  rightY = (canvas.height - paddleHeight) / 2;
});

loop();