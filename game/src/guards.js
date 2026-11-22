// Midnight Vault Heist — the guards. Each one walks a loop of waypoints,
// sweeps a vision cone ahead of him, and either patrols, investigates a
// thrown coin, or chases the thief he can see. Detection is geometry, not
// chance: inside the cone, in range, with a clear line of sight.
import { GUARD, THIEF } from './config.js';
import { collideCircle, hasLineOfSight } from './level.js';

export function makeGuards() {
  return [
    {
      name: 'Rook', x: 420, y: 300, r: GUARD.radius, angle: 0,
      waypoints: [{ x: 420, y: 300 }, { x: 420, y: 580 }, { x: 700, y: 580 }, { x: 700, y: 300 }],
      wp: 0, state: 'patrol', investigate: null, investigateT: 0, alertT: 0,
    },
    {
      name: 'Bishop', x: 950, y: 180, r: GUARD.radius, angle: Math.PI / 2,
      waypoints: [{ x: 950, y: 180 }, { x: 1180, y: 180 }, { x: 1180, y: 640 }, { x: 950, y: 640 }],
      wp: 1, state: 'patrol', investigate: null, investigateT: 0, alertT: 0,
    },
    {
      name: 'Knight', x: 200, y: 120, r: GUARD.radius, angle: Math.PI,
      waypoints: [{ x: 200, y: 120 }, { x: 480, y: 120 }, { x: 480, y: 480 }, { x: 200, y: 480 }],
      wp: 0, state: 'patrol', investigate: null, investigateT: 0, alertT: 0,
    },
  ];
}

// A guard spots the thief when the thief is inside his cone, within range
// (shorter when the thief is sneaking), and nothing blocks the view.
export function guardSeesThief(guard, thief, level) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD.coneRange * (thief.sneaking ? THIEF.sneakSpotFactor : 1);
  if (dist > range || dist < 1) return dist < 26; // bumping into him counts
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.coneHalfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y, level);
}

function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  collideCircle(level, guard);
  return dist - step < 4;
}

export function updateGuards(guards, thief, level, dt) {
  for (const g of guards) {
    const sees = guardSeesThief(g, thief, level);
    if (sees) {
      g.state = 'chase';
      g.alertT = 0.6; // keeps the "!" above his head a beat after losing you
    } else if (g.state === 'chase') {
      g.state = 'patrol';
    }
    if (g.state === 'chase') {
      moveToward(g, thief.x, thief.y, GUARD.chaseSpeed, dt, level);
    } else if (g.state === 'investigate' && g.investigate) {
      const arrived = moveToward(g, g.investigate.x, g.investigate.y, GUARD.patrolSpeed * 1.4, dt, level);
      g.investigateT -= dt;
      if (arrived || g.investigateT <= 0) {
        g.state = 'patrol';
        g.investigate = null;
      }
    } else {
      const target = g.waypoints[g.wp];
      const arrived = moveToward(g, target.x, target.y, GUARD.patrolSpeed, dt, level);
      if (arrived) g.wp = (g.wp + 1) % g.waypoints.length;
    }
    if (g.alertT > 0) g.alertT -= dt;
  }
}

// A thrown coin clinks to the floor: every guard in earshot walks over to
// look. Returns how many guards took the bait, for the HUD toast.
export function distractGuards(guards, x, y) {
  let baited = 0;
  for (const g of guards) {
    if (Math.hypot(g.x - x, g.y - y) < 270) {
      g.state = 'investigate';
      g.investigate = { x, y };
      g.investigateT = 4.5;
      baited++;
    }
  }
  return baited;
}
