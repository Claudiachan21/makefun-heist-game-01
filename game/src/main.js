// Midnight Vault Heist — the game loop. Owns the state machine (title,
// playing, busted, win), the keyboard and mouse, the alarm meter, the
// timer and the win/lose checks. The world itself lives in level.js,
// guards.js, cameras.js and thief.js; this file only runs it.
import { ALARM, CAMERA, GUARD, THIEF, VIEW } from './config.js';
import { buildLevel } from './level.js';
import { distractGuards, guardSeesThief, makeGuards, updateGuards } from './guards.js';
import { makeCameras, updateCameras } from './cameras.js';
import { makeThief, nearestLoot, thiefInExit, throwCoin, updateCoin, updateThief } from './thief.js';
import { ensureAudio, isMuted, sfx, toggleMute } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.w * dpr;
  canvas.height = VIEW.h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

function newGame() {
  const level = buildLevel();
  return {
    level,
    guards: makeGuards(),
    cameras: makeCameras(),
    thief: makeThief(level.spawn),
    state: 'title',
    alarm: 0,
    peakAlarm: 0,
    time: 0,
    timeLeft: 300, // five minutes on the clock before the night shift arrives
    toast: '',
    toastT: 0,
    nearLoot: null,
    lootTotal: level.loot.length,
    lootGot: 0,
    winTime: 0,
    stepT: 0,
  };
}

const game = newGame();
const keys = { up: false, down: false, left: false, right: false, sneak: false };

function setToast(text, seconds = 3) {
  game.toast = text;
  game.toastT = seconds;
}

function grabLoot() {
  const item = nearestLoot(game.thief, game.level);
  if (!item) return;
  item.taken = true;
  game.thief.lootTaken += 1;
  game.thief.lootValue += item.value;
  game.lootGot += 1;
  sfx.grab();
  setToast(item.kind === 'vault'
    ? `VAULT GOLD! $${item.value.toLocaleString('en-US')} — ${game.lootTotal - game.lootGot} stash left`
    : `Loot grabbed: $${item.value.toLocaleString('en-US')} — ${game.lootTotal - game.lootGot} stash left`);
  if (game.lootGot === game.lootTotal) {
    setToast('ALL LOOT! Get to the green EXIT door!', 4);
  }
}

function bust() {
  game.state = 'busted';
  sfx.busted();
  statusEl.textContent = 'Busted! The alarm reached 100 percent.';
}

function win() {
  game.state = 'win';
  game.winTime = Math.round(game.time);
  sfx.win();
  statusEl.textContent = `Clean getaway! ${game.thief.lootValue} dollars stolen.`;
}

function update(dt) {
  if (game.state !== 'playing' || game.frozen) return;
  game.time += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) { game.timeLeft = 0; bust(); return; }
  if (game.toastT > 0) {
    game.toastT -= dt;
    if (game.toastT <= 0) game.toast = '';
  }
  updateThief(game.thief, keys, game.level, dt);
  // Footstep ticks while walking, quieter while sneaking.
  game.stepT -= dt;
  if (game.thief.moving && game.stepT <= 0) {
    game.stepT = game.thief.sneaking ? 0.5 : 0.32;
    sfx.step();
  }
  const landed = updateCoin(game.thief, game.level, dt);
  if (landed) {
    sfx.clink();
    const baited = distractGuards(game.guards, landed.x, landed.y);
    setToast(baited > 0 ? `Clink! ${baited} guard${baited > 1 ? 's' : ''} went to look.` : 'The coin clinks — nobody heard it.');
  }
  updateGuards(game.guards, game.thief, game.level, dt);
  updateCameras(game.cameras, game.thief, game.level, dt, game.time);
  // The alarm: guards and cameras raise it while they see you, it cools
  // down whenever nobody does. At 100 the night is over.
  let spotted = false;
  for (const g of game.guards) {
    if (guardSeesThief(g, game.thief, game.level)) {
      spotted = true;
      game.alarm += GUARD.spotRate * dt;
      if (g.alertT <= 0) { g.alertT = 0.6; sfx.spotted(); }
    }
  }
  for (const c of game.cameras) {
    if (c.spotted) { spotted = true; game.alarm += CAMERA.spotRate * dt; }
  }
  if (!spotted) game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  game.alarm = Math.min(ALARM.max, game.alarm);
  game.peakAlarm = Math.max(game.peakAlarm, game.alarm);
  if (game.alarm >= ALARM.max) { bust(); return; }
  game.nearLoot = nearestLoot(game.thief, game.level);
  if (game.lootGot === game.lootTotal && thiefInExit(game.thief, game.level)) win();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}

// --- Input: keyboard + mouse, nothing else. ---
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};
window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code] !== undefined) {
    keys[KEYMAP[e.code]] = true;
    e.preventDefault();
  }
  if (e.code === 'Enter' && game.state === 'title') {
    ensureAudio();
    game.state = 'playing';
    statusEl.textContent = 'The heist is on. Steal the loot and escape.';
  } else if (e.code === 'KeyE' && game.state === 'playing') {
    grabLoot();
  } else if (e.code === 'KeyR') {
    const keep = game.state;
    Object.assign(game, newGame());
    game.state = keep === 'title' ? 'title' : 'playing';
  } else if (e.code === 'KeyM') {
    setToast(toggleMute() ? 'Sound off (M to turn back on)' : 'Sound on', 2);
  }
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code] !== undefined) keys[KEYMAP[e.code]] = false;
});
canvas.addEventListener('mousedown', (e) => {
  ensureAudio();
  if (game.state === 'title') {
    game.state = 'playing';
    statusEl.textContent = 'The heist is on. Steal the loot and escape.';
    return;
  }
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW.w;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW.h;
  if (throwCoin(game.thief, x, y)) sfx.coin();
  else setToast(game.thief.coins <= 0 ? 'Out of coins!' : 'A coin is already in the air.', 2);
});

// A ?shot= URL stages a moment for screenshots; plain play ignores it.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) applyShot(game, shot);

// Test hook: play-test scripts read the live state through this.
window.__heist = game;

requestAnimationFrame(frame);
