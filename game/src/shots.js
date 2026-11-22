// Midnight Vault Heist — staged shots for screenshots. A ?shot= URL
// parameter freezes a hand-picked moment of the game so the screenshots
// show the real game at its best: the same code, the same render, just a
// chosen position and alarm level. Playing normally ignores all of this.

export function applyShot(game, shot) {
  const { thief, guards, cameras, level } = game;
  if (shot === 'start') {
    // Title screen over the live room: thief at the door, guards mid-patrol.
    game.state = 'title';
    return;
  }
  game.state = 'playing';
  // Staged shots are frozen tableaus: the simulation does not run, so the
  // alarm, the guards and the loot stay exactly as staged for the photo.
  game.frozen = true;
  if (shot === 'play') {
    // The cover: mid-heist, every required element in one frame. The thief
    // sneaks past Rook's cone toward the vault while a camera sweeps and
    // the alarm sits part-way up.
    thief.x = 760;
    thief.y = 380;
    thief.angle = 0.6;
    thief.sneaking = true;
    thief.lootTaken = 1;
    thief.lootValue = 1200;
    game.lootGot = 1;
    level.loot[1].taken = true;
    guards[0].x = 620; guards[0].y = 380; guards[0].angle = 0.5;
    guards[1].x = 1080; guards[1].y = 240; guards[1].angle = Math.PI;
    guards[2].x = 330; guards[2].y = 140; guards[2].angle = Math.PI / 2;
    cameras[0].angle = Math.PI / 2 + 0.5;
    cameras[1].angle = -Math.PI / 2 - 0.4;
    cameras[2].angle = Math.PI - 0.5;
    game.alarm = 38;
    game.toast = 'Rook is turning — slip past his cone!';
  } else if (shot === 'alarm') {
    // Caught in the open: alarm screaming, a guard chasing, camera lit.
    thief.x = 700;
    thief.y = 300;
    thief.angle = -0.4;
    thief.lootTaken = 2;
    thief.lootValue = 3000;
    game.lootGot = 2;
    level.loot[1].taken = true;
    level.loot[2].taken = true;
    guards[0].x = 610; guards[0].y = 300; guards[0].angle = 0;
    guards[0].state = 'chase';
    guards[0].alertT = 0.6;
    guards[1].x = 900; guards[1].y = 200; guards[1].angle = Math.PI / 2;
    cameras[0].spotted = true;
    cameras[0].angle = 0.9;
    game.alarm = 82;
    game.toast = 'SPOTTED! Break line of sight — now!';
  } else if (shot === 'win') {
    // The getaway: vault emptied, thief sprinting for the green exit.
    thief.x = 260;
    thief.y = 640;
    thief.angle = Math.PI;
    thief.lootTaken = 3;
    thief.lootValue = 8000;
    game.lootGot = 3;
    for (const item of level.loot) item.taken = true;
    guards[0].x = 760; guards[0].y = 480; guards[0].angle = Math.PI;
    guards[1].x = 1180; guards[1].y = 500; guards[1].angle = -Math.PI / 2;
    guards[2].x = 240; guards[2].y = 200; guards[2].angle = 0;
    game.alarm = 12;
    game.toast = 'All loot grabbed — run for the EXIT!';
  }
  game.time = shot === 'play' ? 6.5 : shot === 'alarm' ? 42 : 95;
}
