// Midnight Vault Heist — sound, synthesized live with WebAudio. No audio
// files ship with the game: every blip is an oscillator, so the game stays
// a handful of static files and plays with no network request.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() { return muted; }

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  if (muted || !ensureAudio()) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  step() { tone(190 + Math.random() * 60, 0.05, 'sine', 0.03); },
  coin() { tone(1250, 0.09, 'triangle', 0.08); tone(1875, 0.14, 'triangle', 0.07, 0.07); },
  grab() { tone(880, 0.1, 'triangle', 0.09); tone(1318, 0.16, 'triangle', 0.08, 0.08); },
  clink() { tone(2400, 0.06, 'square', 0.05); tone(1800, 0.09, 'square', 0.04, 0.05); },
  spotted() { tone(520, 0.22, 'sawtooth', 0.09, 0, 780); },
  busted() { tone(220, 0.5, 'sawtooth', 0.12, 0, 110); tone(165, 0.6, 'sawtooth', 0.1, 0.15, 82); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11));
  },
};
