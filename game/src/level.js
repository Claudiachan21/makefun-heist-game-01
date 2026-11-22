// Midnight Vault Heist — the museum floor. Walls, crates, the vault, the
// display cases, the loot and the exit door. Everything is a rectangle the
// other modules can test against; nothing here moves.
import { LOOT_VALUE } from './config.js';

// The room is one big gallery (1280x720) with an outer wall and interior
// partitions that force three different routes to the vault: the open
// middle, the crate maze on the left, and the narrow corridor on the right.
export function buildLevel() {
  const walls = [
    // Outer shell (thick, so cones never leak outside the room).
    { x: 0, y: 0, w: 1280, h: 26 },
    { x: 0, y: 694, w: 1280, h: 26 },
    { x: 0, y: 0, w: 26, h: 720 },
    { x: 1254, y: 0, w: 26, h: 720 },
    // Interior partitions: a long gallery wall with two gaps, and a vault
    // antechamber wall that makes the gold a real detour.
    { x: 300, y: 190, w: 26, h: 260 },
    { x: 560, y: 190, w: 26, h: 150 },
    { x: 560, y: 420, w: 26, h: 120 },
    { x: 830, y: 120, w: 26, h: 220 },
    { x: 830, y: 430, w: 26, h: 130 },
    { x: 1000, y: 300, w: 150, h: 26 },
    { x: 1000, y: 560, w: 150, h: 26 },
  ];
  // Crates are cover: they block sight and movement, and the thief can
  // crouch behind them while a guard's cone sweeps past.
  const crates = [
    { x: 150, y: 300, w: 74, h: 74 },
    { x: 150, y: 470, w: 74, h: 74 },
    { x: 380, y: 520, w: 74, h: 74 },
    { x: 660, y: 90, w: 74, h: 74 },
    { x: 660, y: 560, w: 74, h: 74 },
    { x: 920, y: 470, w: 74, h: 74 },
    { x: 1080, y: 130, w: 74, h: 74 },
  ];
  // Three loot targets: the vault gold (the big score) and two display cases.
  const loot = [
    { id: 'vault', kind: 'vault', x: 1145, y: 420, value: LOOT_VALUE.vault, taken: false },
    { id: 'caseA', kind: 'case', x: 430, y: 110, value: LOOT_VALUE.caseA, taken: false },
    { id: 'caseB', kind: 'case', x: 950, y: 640, value: LOOT_VALUE.caseB, taken: false },
  ];
  // The vault itself: a gold-doored strongroom in the top-right corner.
  const vault = { x: 1060, y: 330, w: 194, h: 200 };
  // The getaway: a green service door at the bottom-left, where the thief
  // starts the night standing just inside it.
  const exit = { x: 26, y: 620, w: 90, h: 74 };
  const spawn = { x: 90, y: 650 };
  return { walls, crates, loot, vault, exit, spawn };
}

// Every solid rectangle, walls and crates together, for collision and sight.
export function solids(level) {
  return level.walls.concat(level.crates);
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does the segment (x1,y1)-(x2,y2) hit rectangle r? Samples the segment in
// short steps: cheap, and exact enough for a vision cone at this scale.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInRect(x1 + dx * t, y1 + dy * t, r)) return true;
  }
  return false;
}

// True when nothing solid stands between the two points.
export function hasLineOfSight(x1, y1, x2, y2, level) {
  for (const s of solids(level)) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

// Push a circle out of every solid rectangle it overlaps. Returns true
// when the circle was moved (used to tell walking into a wall from walking
// freely). The thief and the guards both move through this one helper.
export function collideCircle(level, body) {
  let hit = false;
  for (const s of solids(level)) {
    const cx = Math.max(s.x, Math.min(body.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(body.y, s.y + s.h));
    const dx = body.x - cx;
    const dy = body.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < body.r * body.r) {
      hit = true;
      const d = Math.sqrt(d2) || 0.001;
      body.x = cx + (dx / d) * body.r;
      body.y = cy + (dy / d) * body.r;
    }
  }
  return hit;
}
