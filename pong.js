const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');

const paddleHeight = 80, paddleWidth = 10;
let leftY = (canvas.height - paddleHeight) / 2;
let rightY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballVX = 4, ballVY = 3;
let keys = {};

let scoreLeft = 0;
let scoreRight = 0;

let running = false; // controla se o jogo está rodando

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  // paddles
  ctx.fillRect(10, leftY, paddleWidth, paddleHeight);
  ctx.fillRect(canvas.width - 20, rightY, paddleWidth, paddleHeight);

  // linha pontilhada central
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);
  }

  // bola
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  // placar
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(scoreLeft, canvas.width / 4, 30);
  ctx.fillText(scoreRight, canvas.width * 3 / 4, 30);
}

function update() {
  if (!running) return;

  // Move paddles
  if (keys['w']) leftY -= 5;
  if (keys['s']) leftY += 5;
  if (keys['ArrowUp']) rightY -= 5;
  if (keys['ArrowDown']) rightY += 5;

  // Keep paddles on screen
  leftY = Math.max(0, Math.min(canvas.height - paddleHeight, leftY));
  rightY = Math.max(0, Math.min(canvas.height - paddleHeight, rightY));

  // Move ball
  ballX += ballVX;
  ballY += ballVY;

  // Bounce top/bottom
  if (ballY < 0 || ballY > canvas.height) ballVY *= -1;

  // Collision left paddle
  if (ballX < 10 + paddleWidth && ballY > leftY && ballY < leftY + paddleHeight) {
    ballVX *= -1;
  }

  // Collision right paddle
  if (ballX > canvas.width - 10 - paddleWidth && ballY > rightY && ballY < rightY + paddleHeight) {
    ballVX *= -1;
  }

  // Reset if out of bounds + atualizar placar
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

// Clicar no botão inicia o jogo
startBtn.addEventListener('click', () => {
  menu.style.display = 'none';  // esconde menu
  canvas.style.display = 'block'; // mostra canvas
  running = true; // ativa o jogo
});

loop();
