// Midnight Vault Heist — the thief. WASD or arrows to move, Shift to
// sneak, E to pocket nearby loot, click to throw a coin that distracts
// guards. The thief is a circle with a position, a facing, and a pocket
// full of stolen gold; everything else about him lives in main.js.
import { COINS, THIEF } from './config.js';
import { collideCircle, pointInRect } from './level.js';

export function makeThief(spawn) {
  return {
    x: spawn.x, y: spawn.y, r: THIEF.radius,
    angle: -Math.PI / 2, // facing up the room, into the dark
    sneaking: false, moving: false,
    lootTaken: 0, lootValue: 0,
    coins: COINS.start,
    coin: null, // a coin in flight, or null
    coinTarget: null,
  };
}

// Move from the held keys. Returns nothing; the body is mutated in place.
// Walls stop the thief axis by axis, so sliding along a wall feels right.
export function updateThief(thief, keys, level, dt) {
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  thief.sneaking = !!keys.sneak;
  thief.moving = mx !== 0 || my !== 0;
  if (!thief.moving) return;
  const len = Math.hypot(mx, my);
  const speed = (thief.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed) * dt;
  thief.angle = Math.atan2(my, mx);
  thief.x += (mx / len) * speed;
  collideCircle(level, thief);
  thief.y += (my / len) * speed;
  collideCircle(level, thief);
  thief.x = Math.max(30, Math.min(1250, thief.x));
  thief.y = Math.max(30, Math.min(690, thief.y));
}

// The nearest loot the thief can grab right now, or null.
export function nearestLoot(thief, level) {
  let best = null;
  let bestD = THIEF.grabRange;
  for (const item of level.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - thief.x, item.y - thief.y);
    if (d < bestD) { best = item; bestD = d; }
  }
  return best;
}

export function thiefInExit(thief, level) {
  return pointInRect(thief.x, thief.y, level.exit);
}

// Start a coin throw toward the clicked point. The coin flies in a straight
// line and clinks where it lands (or where a wall stops it).
export function throwCoin(thief, tx, ty) {
  if (thief.coins <= 0 || thief.coin) return false;
  thief.coins -= 1;
  const dx = tx - thief.x;
  const dy = ty - thief.y;
  const dist = Math.hypot(dx, dy) || 1;
  thief.coin = { x: thief.x, y: thief.y, vx: (dx / dist) * COINS.throwSpeed, vy: (dy / dist) * COINS.throwSpeed, tx, ty };
  return true;
}

export function updateCoin(thief, level, dt) {
  const c = thief.coin;
  if (!c) return null;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  const arrived = Math.hypot(c.tx - c.x, c.ty - c.y) < 14;
  const blocked = collideCircle(level, { x: c.x, y: c.y, r: 3 });
  if (arrived || blocked) {
    thief.coin = null;
    return { x: c.x, y: c.y };
  }
  return null;
}
