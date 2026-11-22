// Midnight Vault Heist — tuning constants. One place for every number the
// other modules share, so balancing never means hunting through files.
export const VIEW = { w: 1280, h: 720 };

export const THIEF = {
  radius: 13,
  walkSpeed: 205,      // px per second, standing up
  sneakSpeed: 105,     // px per second, crouched: slower, harder to spot
  grabRange: 46,       // how close to loot to press E
  sneakSpotFactor: 0.58, // guards see a sneaking thief at 58% of normal range
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 132,
  coneRange: 235,
  coneHalfAngle: 0.62, // radians either side of facing
  spotRate: 52,        // alarm points per second while a guard sees you
  investigateSeconds: 4.5,
};

export const CAMERA = {
  coneRange: 265,
  coneHalfAngle: 0.5,
  sweepSpeed: 0.55,    // radians per second
  spotRate: 34,
};

export const ALARM = {
  max: 100,
  decayPerSecond: 9,
  warnAt: 55,          // HUD turns red and the music hurries past this
};

export const COINS = { start: 5, distractRange: 270, throwSpeed: 620 };

export const LOOT_VALUE = { vault: 5000, caseA: 1200, caseB: 1800 };

export const COLORS = {
  floorA: '#20242f',
  floorB: '#1b1f2a',
  wall: '#3a415c',
  wallTop: '#4d5878',
  crate: '#6b4f2a',
  crateTop: '#8a6a38',
  vaultDoor: '#8c7a2e',
  gold: '#ffd94a',
  goldDark: '#c79a1d',
  guard: '#3f6fd8',
  guardDark: '#2a4a96',
  camera: '#d83a3a',
  thief: '#111318',
  thiefBand: '#ff7a1a',
  coneGuard: 'rgba(255, 214, 64, 0.20)',
  coneGuardEdge: 'rgba(255, 214, 64, 0.55)',
  coneCamera: 'rgba(255, 64, 64, 0.16)',
  coneCameraEdge: 'rgba(255, 64, 64, 0.5)',
  exit: '#39d98a',
};
