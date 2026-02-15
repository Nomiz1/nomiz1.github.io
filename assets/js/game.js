const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const timeEl = document.getElementById("time");
const speedEl = document.getElementById("speed");
const menuEl = document.getElementById("menu");
const gameoverEl = document.getElementById("gameover");
const finalTimeEl = document.getElementById("finalTime");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");

const road = {
  x: canvas.width * 0.25,
  y: 0,
  width: canvas.width * 0.5,
  height: canvas.height,
};

const car = {
  width: 40,
  y: canvas.height - 120,
  speedX: 0,
  maxX: 0,
};

    const accelerate = keys.has("ArrowUp") || keys.has("w");
    const baseSpeed = 240 + state.time * 6;
    let targetSpeed = baseSpeed;
    if (accelerate) targetSpeed += 120;
    if (brake) targetSpeed -= 120;
    targetSpeed = clamp(targetSpeed, 120, 520);
    state.speed += (targetSpeed - state.speed) * Math.min(1, delta * 3);
const state = {
  running: false,
  time: 0,
  speed: 240,
  difficulty: 1,
  obstacles: [],
  people: [],
  traffic: [],
  spawnTimer: 0,
  spawnInterval: 1.4,
};

const keys = new Set();

const rand = (min, max) => Math.random() * (max - min) + min;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetGame() {
  state.time = 0;
  state.speed = 240;
  state.difficulty = 1;
  state.obstacles = [];
  state.people = [];
  state.traffic = [];
  state.spawnTimer = 0;
  state.spawnInterval = 1.4;
  car.x = canvas.width * 0.5 - car.width / 2;
  car.speedX = 0;
  state.running = true;
  gameoverEl.classList.add("hidden");
}

function spawnObstacle() {
  const laneWidth = road.width / 3;
  const laneIndex = Math.floor(rand(0, 3));
  const x = road.x + laneWidth * laneIndex + laneWidth / 2 - 18;
  const typeRoll = Math.random();

  if (typeRoll < 0.4) {
    state.obstacles.push({
      x,
      y: -60,
      width: 36,
      height: 36,
      kind: "tire",
    });
  } else if (typeRoll < 0.7) {
    state.people.push({
      x: road.x - 60,
      y: rand(120, canvas.height - 200),
      width: 26,
      height: 36,
      progress: 0,
      speed: rand(30, 60) * state.difficulty,
    });
  } else {
    state.traffic.push({
      x,
      y: -80,
      width: 40,
      height: 70,
      speed: rand(100, 200) * state.difficulty,
      direction: Math.random() > 0.5 ? 1 : -1,
    });
  }
}

function update(delta) {
  if (!state.running) return;

  state.time += delta;
  timeEl.textContent = state.time.toFixed(1);
  speedEl.textContent = Math.round(state.speed);

  state.difficulty = 1 + state.time / 20;

  const moveLeft = keys.has("ArrowLeft") || keys.has("a");
  const moveRight = keys.has("ArrowRight") || keys.has("d");
  const accelerate = keys.has("ArrowUp") || keys.has("w");
  const brake = keys.has("ArrowDown") || keys.has("s");

  const baseSpeed = 240 + state.time * 6;
  let targetSpeed = baseSpeed;
  if (accelerate) targetSpeed += 120;
  if (brake) targetSpeed -= 120;
  targetSpeed = clamp(targetSpeed, 120, 520);
  state.speed += (targetSpeed - state.speed) * Math.min(1, delta * 3);

  const accel = 520;
  car.speedX += (moveRight - moveLeft) * accel * delta;
  car.speedX *= 0.88;

  car.x += car.speedX * delta;
  car.maxX = road.x + road.width - car.width;
  car.x = clamp(car.x, road.x, car.maxX);

  const scrollSpeed = state.speed * delta;

  state.spawnTimer += delta;
  state.spawnInterval = Math.max(0.55, 1.4 - state.time / 50);
  if (state.spawnTimer >= state.spawnInterval) {
    spawnObstacle();
    state.spawnTimer = 0;
  }

  state.obstacles.forEach((ob) => {
    ob.y += scrollSpeed;
  });

  state.traffic.forEach((t) => {
    t.y += scrollSpeed + t.speed * delta * (t.direction === 1 ? 1 : 0.7);
  });

  state.people.forEach((p) => {
    p.progress += delta * p.speed;
  });

  state.obstacles = state.obstacles.filter((ob) => ob.y < canvas.height + 80);
  state.traffic = state.traffic.filter((t) => t.y < canvas.height + 120);
  state.people = state.people.filter((p) => p.progress < road.width + 120);

  const carRect = { x: car.x, y: car.y, width: car.width, height: car.height };

  if (state.obstacles.some((ob) => collide(carRect, ob))) {
    triggerGameOver();
  }

  if (state.traffic.some((t) => collide(carRect, t))) {
    triggerGameOver();
  }

  if (
    state.people.some((p) =>
      collide(carRect, {
        x: p.x + p.progress,
        y: p.y,
        width: p.width,
        height: p.height,
      })
    )
  ) {
    triggerGameOver();
  }

  updateAudio(state.speed / Math.max(160, targetSpeed), state.running);
}

function collide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function triggerGameOver() {
  state.running = false;
  finalTimeEl.textContent = state.time.toFixed(1);
  gameoverEl.classList.remove("hidden");
  playCrash();
}

function drawBackground(delta) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f1724";
  ctx.fillRect(0, 0, road.x, canvas.height);
  ctx.fillRect(road.x + road.width, 0, road.x, canvas.height);

  ctx.fillStyle = "#13301b";
  for (let i = 0; i < 18; i++) {
    const y = (i * 80 + (state.time * 200) % 80) % canvas.height;
    drawTree(road.x - 50, y);
    drawTree(road.x + road.width + 50, y + 40);
  }

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(road.x, 0, road.width, canvas.height);

  ctx.strokeStyle = "#ffd65a";
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 24]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, -50 + (state.time * 260) % 60);
  ctx.lineTo(canvas.width / 2, canvas.height + 50);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTree(x, y) {
  ctx.fillStyle = "#1f3b21";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c3b1e";
  ctx.fillRect(x - 4, y + 10, 8, 22);
}

function drawCar(entity, color) {
  ctx.fillStyle = color;
  ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(entity.x + 6, entity.y + 10, entity.width - 12, 16);
  ctx.fillRect(entity.x + 6, entity.y + entity.height - 26, entity.width - 12, 16);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(entity.x + 6, entity.y + 30, entity.width - 12, 12);
}

function drawObstacles() {
  state.obstacles.forEach((ob) => {
    ctx.fillStyle = "#20242f";
    ctx.beginPath();
    ctx.arc(ob.x + ob.width / 2, ob.y + ob.height / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#697a8a";
    ctx.lineWidth = 4;
    ctx.stroke();
  });

  state.people.forEach((p) => {
    const x = p.x + p.progress;
    ctx.fillStyle = "#f97316";
    ctx.fillRect(x, p.y, p.width, p.height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + 4, p.y + 6, p.width - 8, 8);
  });

  state.traffic.forEach((t) => {
    drawCar(t, "#e11d48");
  });
}

function render(delta) {
  drawBackground(delta);
  drawObstacles();
  drawCar(car, "#38bdf8");
}

let lastTime = 0;

function loop(timestamp) {
  const delta = Math.min(0.033, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  if (state.running) {
    update(delta);
  }
  render(delta);
  requestAnimationFrame(loop);
}

function setupInput() {
  window.addEventListener("keydown", (event) => {
    keys.add(event.key);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
    }
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.key);
  });
}

function setupMenu() {
  playBtn.addEventListener("click", () => {
    menuEl.classList.add("hidden");
    resetGame();
    ensureAudio();
  });

  restartBtn.addEventListener("click", () => {
    gameoverEl.classList.add("hidden");
    resetGame();
  });
}

function ensureAudio() {
  if (state.audio) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctxAudio = new AudioCtx();
  const master = ctxAudio.createGain();
  master.gain.value = 0.12;
  master.connect(ctxAudio.destination);

  const engineOsc = ctxAudio.createOscillator();
  engineOsc.type = "triangle";
  const engineFilter = ctxAudio.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 420;
  engineFilter.Q.value = 0.7;
  const engineGain = ctxAudio.createGain();
  engineGain.gain.value = 0.03;
  engineOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(master);
  engineOsc.start();

  const musicOsc = ctxAudio.createOscillator();
  musicOsc.type = "triangle";
  const musicGain = ctxAudio.createGain();
  musicGain.gain.value = 0.03;
  musicOsc.connect(musicGain);
  musicGain.connect(master);
  musicOsc.start();

  const padOsc = ctxAudio.createOscillator();
  padOsc.type = "sawtooth";
  const padGain = ctxAudio.createGain();
  padGain.gain.value = 0.02;
  padOsc.connect(padGain);
  padGain.connect(master);
  padOsc.start();

  const bassOsc = ctxAudio.createOscillator();
  bassOsc.type = "square";
  const bassGain = ctxAudio.createGain();
  bassGain.gain.value = 0.02;
  bassOsc.connect(bassGain);
  bassGain.connect(master);
  bassOsc.start();

  const arpOsc = ctxAudio.createOscillator();
  arpOsc.type = "triangle";
  const arpGain = ctxAudio.createGain();
  arpGain.gain.value = 0.015;
  arpOsc.connect(arpGain);
  arpGain.connect(master);
  arpOsc.start();

  const lfo = ctxAudio.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.25;
  const lfoGain = ctxAudio.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(padOsc.frequency);
  lfo.start();

  state.audio = {
    ctx: ctxAudio,
    master,
    engineOsc,
    engineFilter,
    engineGain,
    musicOsc,
    musicGain,
    padOsc,
    padGain,
    bassOsc,
    bassGain,
    arpOsc,
    arpGain,
    lfo,
    seqTimer: null,
    seqStep: 0,
  };

  playMusic();
}

function updateAudio(ratio, running) {
  if (!state.audio) return;
  const { engineOsc, engineGain, engineFilter, musicOsc, ctx } = state.audio;
  const base = 70;
  const targetFreq = base + ratio * 140;
  const now = ctx.currentTime;
  engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
  engineFilter.frequency.setTargetAtTime(280 + ratio * 260, now, 0.08);
  engineGain.gain.setTargetAtTime(running ? 0.035 + ratio * 0.015 : 0.008, now, 0.08);
  musicOsc.frequency.value = 220 + Math.sin(state.time * 0.5) * 30;
}

function playMusic() {
  if (!state.audio) return;
  const { ctx, musicOsc, padOsc, bassOsc, arpOsc } = state.audio;
  if (ctx.state === "suspended") ctx.resume();
  musicOsc.frequency.value = 220;
  padOsc.frequency.value = 110;
  bassOsc.frequency.value = 55;
  arpOsc.frequency.value = 220;
  startSequencer();
}

function startSequencer() {
  const audio = state.audio;
  if (!audio || audio.seqTimer) return;

  const scale = [0, 3, 5, 7, 10];
  const chordRoots = [48, 43, 50, 45];
  const arpPattern = [0, 2, 4, 2, 0, 3, 4, 3];
  const bpm = 80;
  const stepTime = 60 / bpm / 2;

  audio.seqTimer = setInterval(() => {
    const step = audio.seqStep % arpPattern.length;
    const chord = chordRoots[Math.floor(audio.seqStep / arpPattern.length) % chordRoots.length];
    const arpNote = chord + scale[arpPattern[step]];

    audio.arpOsc.frequency.setValueAtTime(midiToFreq(arpNote), audio.ctx.currentTime);
    audio.bassOsc.frequency.setValueAtTime(midiToFreq(chord - 12), audio.ctx.currentTime);
    audio.padOsc.frequency.setValueAtTime(midiToFreq(chord), audio.ctx.currentTime);

    audio.seqStep += 1;
  }, stepTime * 1000);
}

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function playCrash() {
  if (!state.audio) return;
  const { ctx, master } = state.audio;
  const crash = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  crash.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.2;
  crash.connect(gain);
  gain.connect(master);
  crash.start();
}

setupInput();
setupMenu();
requestAnimationFrame(loop);
