// Tiny WebAudio synth: no audio files. Starts only after a user gesture (browser rule).
let ctx = null, muted = false;
try { muted = localStorage.getItem('lq_mute') === '1'; } catch { /* storage unavailable */ }

function ac() {
  if (muted) return null;
  try {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}
function tone(freq, at = 0, dur = 0.12, type = 'square', vol = 0.07, to = null) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
}
const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI note -> Hz

const PET = {
  pet_gloop: () => { tone(260, 0, 0.16, 'sine', 0.12, 620); tone(380, 0.12, 0.12, 'sine', 0.09, 760); },
  pet_ember: () => { tone(700, 0, 0.07, 'triangle', 0.1, 980); tone(820, 0.1, 0.09, 'triangle', 0.1, 1200); },
  pet_bit: () => { [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.06, 'square', 0.05)); },
  pet_mochi: () => { tone(988, 0, 0.1, 'sine', 0.09); tone(1319, 0.11, 0.16, 'sine', 0.08); },
  pet_nox: () => { tone(300, 0, 0.22, 'sine', 0.12, 230); tone(300, 0.3, 0.26, 'sine', 0.12, 210); },
  pet_drako: () => { tone(110, 0, 0.3, 'sawtooth', 0.07, 220); tone(1500, 0.22, 0.12, 'triangle', 0.05, 2400); },
};

export const sfx = {
  pet: (id) => (PET[id] || PET.pet_gloop)(),
  tick: () => tone(660, 0, 0.04, 'triangle', 0.035),
  orb: () => tone(900 + Math.random() * 300, 0, 0.05, 'sine', 0.04),
  xp: () => { tone(N(76), 0, 0.09, 'triangle', 0.08); tone(N(83), 0.08, 0.14, 'triangle', 0.08); },
  coin: () => { tone(N(88), 0, 0.07, 'square', 0.04); tone(N(95), 0.07, 0.2, 'square', 0.04); },
  levelup: () => { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(N(n), i * 0.09, 0.2, 'square', 0.06)); tone(N(84), 0.7, 0.7, 'triangle', 0.08); tone(N(72), 0.7, 0.7, 'triangle', 0.06); },
  ach: () => { [72, 76, 79].forEach((n, i) => tone(N(n), i * 0.1, 0.25, 'triangle', 0.09)); tone(N(91), 0.35, 0.5, 'sine', 0.08); },
  buy: () => { tone(N(79), 0, 0.08, 'square', 0.05); tone(N(86), 0.08, 0.08, 'square', 0.05); tone(N(91), 0.16, 0.25, 'square', 0.05); },
  error: () => tone(160, 0, 0.18, 'sawtooth', 0.06, 100),
};
export const isMuted = () => muted;
export function setMuted(v) { muted = !!v; try { localStorage.setItem('lq_mute', v ? '1' : '0'); } catch { /* storage unavailable */ } if (!v) sfx.tick(); }
