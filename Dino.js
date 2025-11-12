/* Dino Runner — score only when passing cacti (each = +5 points) */
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  const checkout = $('#checkoutScreen');
  const game = $('#gameScreen');
  const btn = $('#goPayBtn');
  const canvas = $('#runner');
  const scoreEl = $('#score');
  const prompt = $('#prompt');

  let ctx, DPR, W, H, raf;
  let started = false, alive = true, running = false;
  let score = 0;

  const world = { speed: 6, gravity: 0.5, groundY: 0, spawnEvery: [80, 130], spawnTick: 0 };
  const dino = { x: 40, y: 0, w: 44, h: 48, vy: 0, onGround: true };
  const cacti = [];

  function setCanvasSize() {
    DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    W = Math.floor(Math.min(900, window.innerWidth * 0.96));
    H = Math.floor(Math.min(260, window.innerHeight * 0.40));
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    world.groundY = H - 36;
    dino.y = world.groundY - dino.h;
  }

  function showGame() {
    checkout.classList.add('hidden');
    game.classList.remove('hidden');
    game.style.display = 'grid';
    setCanvasSize();
    reset();
    startLoop();
  }

  function reset() {
    cacti.length = 0;
    started = false;
    alive = true;
    score = 0;
    world.speed = 6;
    world.spawnTick = randInt(...world.spawnEvery);
    dino.vy = 0; dino.onGround = true;
    dino.y = world.groundY - dino.h;
    scoreEl.textContent = '0';
    prompt.textContent = 'Press Space / Tap to jump';
    prompt.style.opacity = '.8';
  }

  function startLoop() {
    if (running) return;
    running = true;
    const step = () => {
      if (!running) return;
      update();
      draw();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function stopLoop(){ running = false; if (raf) cancelAnimationFrame(raf); }

  function jump() {
    if (!running) return;
    if (!alive) { reset(); return; }
    started = true;
    if (dino.onGround) { dino.vy = -12; dino.onGround = false; }
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    if (e.code === 'Escape') { stopLoop(); game.classList.add('hidden'); checkout.classList.remove('hidden'); }
  }, { passive:false });
  window.addEventListener('mousedown', jump);
  window.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive:false });
  window.addEventListener('resize', () => { if (!game.classList.contains('hidden')) setCanvasSize(); });

  function update() {
    if (!started || !alive) return;

    // gentle speed ramp
    world.speed += 0.0008;

    // physics
    dino.vy += world.gravity;
    dino.y += dino.vy;
    if (dino.y >= world.groundY - dino.h) {
      dino.y = world.groundY - dino.h;
      dino.vy = 0; dino.onGround = true;
    }

    // spawn cactus
    world.spawnTick--;
    if (world.spawnTick <= 0) {
      const h = randInt(32, 52);
      cacti.push({ x: W + 20, y: world.groundY - h, w: randInt(14, 26), h, counted: false });
      world.spawnTick = randInt(...world.spawnEvery);
    }

    // move / collide / award points when PASSED
    for (let i = cacti.length - 1; i >= 0; i--) {
      const c = cacti[i];
      c.x -= world.speed;

      // collision
      if (hit(dino, c)) {
        alive = false;
        prompt.textContent = 'You crashed! Press Space / Tap to retry';
        prompt.style.opacity = '1';
      }

      // scoring: award once when dino's front passes cactus' far edge
      if (!c.counted && dino.x > c.x + c.w) {
        c.counted = true;
        score += 1;                       // 1 point per cactus
        scoreEl.textContent = score;
        if (score >= 25) {                // passed enough cacti
          prompt.textContent = 'Nice. Proceeding to payment...';
          stopLoop();
          setTimeout(() => { window.location.href = 'payment.html'; }, 800);
        }
      }

      if (c.x + c.w < -10) cacti.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, world.groundY + 2, W, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(dino.x + dino.w - 10, dino.y + 10, 6, 6);
    ctx.fillStyle = '#333';
    cacti.forEach(c => ctx.fillRect(c.x, c.y, c.w, c.h));
  }

  // utils
  const randInt = (a,b) => (Math.random() * (b - a + 1) + a) | 0;
  const hit = (a,b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // wire button
  document.getElementById('goPayBtn').addEventListener('click', showGame);
});