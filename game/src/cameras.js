// Midnight Vault Heist — the security cameras. Each one is bolted to a
// wall and sweeps a red cone back and forth. A camera never moves, never
// sleeps, and spots the thief exactly like a guard does — so the player
// has to time the sweep, not outrun it.
import { CAMERA, THIEF } from './config.js';
import { hasLineOfSight } from './level.js';

export function makeCameras() {
  return [
    {
      // Mounted just clear of the gallery wall, so its own wall never
      // blocks the lens.
      name: 'Cam A', x: 614, y: 214, baseAngle: Math.PI / 2,
      sweep: 0.9, phase: 0, angle: Math.PI / 2, spotted: false,
    },
    {
      name: 'Cam B', x: 884, y: 398, baseAngle: -Math.PI / 2,
      sweep: 1.1, phase: 1.7, angle: -Math.PI / 2, spotted: false,
    },
    {
      name: 'Cam C', x: 1013, y: 622, baseAngle: Math.PI,
      sweep: 0.7, phase: 3.1, angle: Math.PI, spotted: false,
    },
  ];
}

export function updateCameras(cameras, thief, level, dt, time) {
  for (const c of cameras) {
    c.angle = c.baseAngle + Math.sin(time * CAMERA.sweepSpeed + c.phase) * c.sweep;
    const dx = thief.x - c.x;
    const dy = thief.y - c.y;
    const dist = Math.hypot(dx, dy);
    const range = CAMERA.coneRange * (thief.sneaking ? THIEF.sneakSpotFactor : 1);
    let sees = false;
    if (dist <= range && dist > 1) {
      let diff = Math.atan2(dy, dx) - c.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      sees = Math.abs(diff) <= CAMERA.coneHalfAngle
        && hasLineOfSight(c.x, c.y, thief.x, thief.y, level);
    } else if (dist < 20) {
      sees = true; // standing under the lens
    }
    c.spotted = sees;
  }
}
