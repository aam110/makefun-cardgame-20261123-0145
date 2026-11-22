// audio.js — all sound is WebAudio oscillators. No audio files, no network.
// playCard (pluck), attack (thud), burn (crackle-ish), win/loss jingles, click.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when, slideTo) {
  if (muted) return;
  const ac = ensureCtx(); if (!ac) return;
  const t0 = ac.currentTime + (when || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export function playClick() { tone(660, 0.07, 'triangle', 0.08); }
export function playCard() { tone(392, 0.12, 'triangle', 0.14); tone(523, 0.14, 'triangle', 0.12, 0.06); }
export function playAttack() { tone(180, 0.16, 'sawtooth', 0.14, 0, 90); tone(90, 0.2, 'square', 0.1); }
export function playBurn() { tone(880, 0.1, 'sawtooth', 0.07, 0, 440); tone(1100, 0.1, 'sawtooth', 0.05, 0.08, 520); }
export function playHeal() { tone(523, 0.15, 'sine', 0.1); tone(784, 0.2, 'sine', 0.1, 0.1); }
export function playTurn() { tone(440, 0.1, 'triangle', 0.1); tone(587, 0.12, 'triangle', 0.1, 0.08); }
export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, 0.28, 'triangle', 0.14, i * 0.13));
  tone(1319, 0.5, 'triangle', 0.1, 0.55);
}
export function playLoss() {
  const notes = [392, 330, 262, 196];
  notes.forEach((n, i) => tone(n, 0.3, 'sawtooth', 0.07, i * 0.16));
}
export function playError() { tone(140, 0.15, 'square', 0.08); }
