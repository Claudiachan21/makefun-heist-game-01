// Midnight Vault Heist — everything the player sees. Canvas 2D, flat
// colours, one clear meaning per colour: gold is loot, yellow cones are
// guards, red cones are cameras, green is the way out, dark crates are
// cover. Draw order: floor, exit, loot, cones, walls, crates, cameras,
// guards, thief, HUD, then the title / win / busted overlays.
import { ALARM, CAMERA, COLORS, GUARD, VIEW } from './config.js';

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, half, fill, edge) {
  conePath(ctx, x, y, angle, range, half);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = COLORS.floorB;
  for (let y = 26; y < 694; y += 52) {
    for (let x = 26 + ((y / 52) % 2) * 26; x < 1254; x += 52) {
      ctx.fillRect(x, y, 50, 50);
    }
  }
  // A worn red carpet runs from the door to the vault: the thief's route.
  ctx.fillStyle = 'rgba(140, 40, 55, 0.35)';
  ctx.fillRect(60, 640, 1020, 26);
  ctx.fillRect(1060, 330, 26, 336);
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h));
  }
}

function drawCrates(ctx, level) {
  for (const c of level.crates) {
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(c.x, c.y, c.w, 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4);
    ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4);
    ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }
}

function drawVault(ctx, level) {
  const v = level.vault;
  ctx.fillStyle = '#241f10';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = COLORS.vaultDoor;
  ctx.lineWidth = 5;
  ctx.strokeRect(v.x + 6, v.y + 6, v.w - 12, v.h - 12);
  ctx.fillStyle = COLORS.vaultDoor;
  ctx.beginPath();
  ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241f10';
  ctx.beginPath();
  ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8d27a';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('V A U L T', v.x + v.w / 2, v.y + 30);
}

function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.x) * 3;
    const glow = 14 + Math.sin(time * 3 + item.x) * 5;
    ctx.save();
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = glow;
    ctx.fillStyle = COLORS.gold;
    if (item.kind === 'vault') {
      ctx.fillRect(item.x - 22, item.y - 14 + bob, 44, 28);
      ctx.fillStyle = COLORS.goldDark;
      ctx.fillRect(item.x - 22, item.y + 6 + bob, 44, 8);
    } else {
      // Display case: a glass box with a gold bar inside.
      ctx.strokeStyle = 'rgba(180,220,255,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 24, item.y - 18 + bob, 48, 36);
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(item.x - 14, item.y + 8 + bob);
      ctx.lineTo(item.x + 14, item.y + 8 + bob);
      ctx.lineTo(item.x + 9, item.y - 4 + bob);
      ctx.lineTo(item.x - 9, item.y - 4 + bob);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$' + item.value.toLocaleString('en-US'), item.x, item.y - 28 + bob);
  }
}

function drawExit(ctx, level, allLootTaken, time) {
  const e = level.exit;
  const pulse = allLootTaken ? 0.65 + Math.sin(time * 5) * 0.3 : 0.3;
  ctx.fillStyle = `rgba(57, 217, 138, ${pulse})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = COLORS.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#d8ffe9';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  ctx.font = 'bold 11px monospace';
  ctx.fillText(allLootTaken ? 'GO!' : 'LOCKED', e.x + e.w / 2, e.y + e.h - 10);
}

function drawCameras(ctx, cameras) {
  for (const c of cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.coneRange, CAMERA.coneHalfAngle,
      COLORS.coneCamera, COLORS.coneCameraEdge);
    ctx.fillStyle = '#222';
    ctx.fillRect(c.x - 10, c.y - 7, 20, 14);
    ctx.fillStyle = c.spotted ? '#ff2d2d' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    if (c.spotted) {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED!', c.x, c.y - 18);
    }
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const chasing = g.state === 'chase';
    const investigating = g.state === 'investigate';
    drawCone(ctx, g.x, g.y, g.angle, GUARD.coneRange, GUARD.coneHalfAngle,
      chasing ? 'rgba(255, 120, 40, 0.30)' : COLORS.coneGuard,
      chasing ? 'rgba(255, 120, 40, 0.8)' : COLORS.coneGuardEdge);
    ctx.fillStyle = chasing ? '#c22e2e' : COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guardDark;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r - 5, 0, Math.PI * 2);
    ctx.fill();
    // Cap brim points where the guard is looking.
    ctx.fillStyle = chasing ? '#ff5a5a' : '#9db8f5';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * (g.r + 2), g.y + Math.sin(g.angle) * (g.r + 2), 4, 0, Math.PI * 2);
    ctx.fill();
    if (chasing || g.alertT > 0) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - g.r - 8);
    } else if (investigating) {
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - g.r - 8);
    }
    ctx.fillStyle = '#cdd8f5';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + g.r + 14);
  }
}

function drawThief(ctx, thief) {
  const t = thief;
  ctx.save();
  if (t.sneaking) ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefBand;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r - 2, t.angle - 0.9, t.angle + 0.9);
  ctx.stroke();
  // Eyes look where the thief is facing.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.angle) * 6, t.y + Math.sin(t.angle) * 6, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (t.sneaking) {
    ctx.fillStyle = '#9db8f5';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', t.x, t.y + t.r + 14);
  }
  if (t.coin) {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(t.coin.x, t.coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, game) {
  const { thief, alarm, timeLeft, lootTotal, lootGot } = game;
  ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
  ctx.fillRect(0, 0, VIEW.w, 44);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT HEIST', 14, 29);
  // Alarm meter: the heart of the HUD, always visible.
  const ax = 330;
  const aw = 300;
  ctx.fillStyle = '#111';
  ctx.fillRect(ax, 12, aw, 20);
  const frac = alarm / ALARM.max;
  ctx.fillStyle = frac < 0.55 ? '#39d98a' : frac < 0.85 ? '#ffb020' : '#ff3b30';
  ctx.fillRect(ax, 12, aw * frac, 20);
  ctx.strokeStyle = '#e8ecf5';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, 12, aw, 20);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`ALARM ${Math.round(alarm)}%`, ax + aw + 12, 28);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`LOOT ${lootGot}/${lootTotal}  $${thief.lootValue.toLocaleString('en-US')}`, 830, 28);
  ctx.fillStyle = '#e8ecf5';
  ctx.fillText(`COINS ${thief.coins}`, 1060, 28);
  ctx.fillText(`${Math.floor(timeLeft / 60)}:${String(Math.floor(timeLeft % 60)).padStart(2, '0')}`, 1170, 28);
  if (game.toast) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, VIEW.w / 2, 66);
  }
  if (game.nearLoot) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Press E — grab $${game.nearLoot.value.toLocaleString('en-US')} loot`, VIEW.w / 2, VIEW.h - 14);
  }
}

function overlay(ctx, title, lines, color) {
  ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = color;
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.w / 2, 250);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '19px monospace';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.w / 2, 310 + i * 32));
}

export function render(ctx, game) {
  const { level, guards, cameras, thief, time } = game;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx);
  drawExit(ctx, level, game.lootGot === game.lootTotal, time);
  drawVault(ctx, level);
  drawLoot(ctx, level, time);
  drawCameras(ctx, cameras);
  drawGuards(ctx, guards);
  drawWalls(ctx, level);
  drawCrates(ctx, level);
  drawThief(ctx, thief);
  drawHud(ctx, game);
  if (game.state === 'title') {
    overlay(ctx, 'MIDNIGHT VAULT HEIST', [
      'Steal all 3 loot stashes, then slip out the green EXIT door.',
      'WASD / Arrows — move    Shift — sneak    E — grab loot',
      'Click — throw a coin to lure a guard    R — restart    M — mute',
      'Yellow cones are guards. Red cones are cameras. Fill the alarm and you are caught.',
      '',
      'Press ENTER or click to start the heist.',
    ], '#ffd94a');
  } else if (game.state === 'busted') {
    overlay(ctx, 'BUSTED!', [
      `The alarm hit 100%. The guards have you, thief.`,
      `Loot kept: $${thief.lootValue.toLocaleString('en-US')} — the vault keeps the rest.`,
      '',
      'Press R to try the heist again.',
    ], '#ff3b30');
  } else if (game.state === 'win') {
    overlay(ctx, 'CLEAN GETAWAY!', [
      `Every stash stolen: $${thief.lootValue.toLocaleString('en-US')} in ${game.winTime}s.`,
      `Alarm peaked at ${Math.round(game.peakAlarm)}% — the museum never saw you coming.`,
      '',
      'Press R to run it again, faster and quieter.',
    ], '#39d98a');
  }
}
