// Small shared helpers: escaping, toasts, sheets, celebration effects.
import { icon } from './icons.js';
import { petHTML, react, bringPetsToLife, reactActive } from './sprites.js';
import { sfx } from './sound.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const xpNeeded = (lvl) => 100 + 40 * (lvl - 1) + 10 * (lvl - 1) * (lvl - 1); // mirrors SQL xp_needed()
export const fmt = (n) => Number(n || 0).toLocaleString('en-US');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function weekStartKey(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dateKey(x);
}
export function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const h = ms / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))}m left`;
  if (h < 48) return `${Math.round(h)}h left`;
  return `${Math.round(h / 24)}d left`;
}

// ---------- Toasts -----------------------------------------------------------

function toastBox() {
  let b = $('.toasts');
  if (!b) { b = document.createElement('div'); b.className = 'toasts'; b.setAttribute('role', 'status'); document.body.append(b); }
  return b;
}
export function toast(msg, type = '', ms = 3200) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icon(type === 'bad' ? 'alert' : type === 'good' ? 'check' : 'spark', 18)}<span>${esc(msg)}</span>`;
  toastBox().append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms);
}

// ---------- Sheets / dialogs -------------------------------------------------

export function openSheet(html, { center = false, onClose } = {}) {
  const bd = document.createElement('div');
  bd.className = 'backdrop' + (center ? ' center' : '');
  bd.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${center ? '' : '<div class="grab"></div>'}${html}</div>`;
  const close = () => { bd.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
  bd.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(bd);
  return { el: bd.firstElementChild, root: bd, close };
}

/** Promise-based confirm dialog with arbitrary rows. */
export function confirmSheet({ title, body = '', ok = 'Confirm', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const s = openSheet(`<h2>${esc(title)}</h2><div style="margin:12px 0">${body}</div>
      <div class="row"><button class="btn grow" data-no>${esc(cancel)}</button><button class="btn ${danger ? 'danger' : 'primary'} grow" data-yes>${esc(ok)}</button></div>`, { center: true, onClose: () => resolve(false) });
    s.el.querySelector('[data-no]').onclick = () => { s.close(); };
    s.el.querySelector('[data-yes]').onclick = () => { resolve(true); s.root.remove(); };
  });
}

export function loadingHTML(n = 3) { return Array.from({ length: n }, () => '<div class="skeleton"></div>').join(''); }
export function emptyHTML(ic, text) { return `<div class="empty">${icon(ic, 36)}<div>${text}</div></div>`; }
export function errorHTML(msg, retry = true) {
  return `<div class="err" role="alert">${esc(msg)} ${retry ? '<button class="btn sm" data-retry style="margin-left:8px">Retry</button>' : ''}</div>`;
}

// ---------- Celebrations -------------------------------------------------------

const COLORS = ['#35f0ff', '#8b5cf6', '#ff4fd8', '#ffd23f', '#4ade80', '#ffffff'];
const FIRE = ['#ff9a3c', '#ff4d4d', '#ffd23f', '#ff7a45', '#fff1b0', '#ff9a3c'];
const PET_CONFETTI = { pet_mochi: 'hearts', pet_nox: 'stars', pet_ember: 'fire', pet_drako: 'fire' };
export function confetti(n = 60, fx = 'default', origin = { x: innerWidth / 2, y: innerHeight * 0.45 }) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 230;
    c.style.cssText = `left:${origin.x}px;top:${origin.y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 80 + 260 * Math.random()}px;--rot:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.15}s;`;
    if (fx === 'hearts') { c.innerHTML = icon('heart', 12).replace('fill="none"', 'fill="#ff4f9a"'); c.style.color = '#ff4f9a'; c.style.background = 'none'; }
    else if (fx === 'stars') { c.innerHTML = icon('star', 12).replace('fill="none"', 'fill="#ffd23f"'); c.style.color = '#ffd23f'; c.style.background = 'none'; }
    else { c.style.background = (fx === 'fire' ? FIRE : COLORS)[i % COLORS.length]; c.style.borderRadius = Math.random() < 0.4 ? '50%' : '2px'; }
    document.body.append(c);
    setTimeout(() => c.remove(), 2300);
  }
}

// ---------- Flying XP / Coin orbs -------------------------------------------------

const centerOf = (t) => {
  if (!t) return null;
  if ('x' in t) return t;
  const r = t.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return null; // off-screen targets are skipped
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
let lastOrbSound = 0;
function arrive(t) {
  if (t.classList?.contains('pet')) react(t, 'xp');
  else { t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setTimeout(() => t.classList.remove('hit'), 520); }
  const now = performance.now();
  if (now - lastOrbSound > 70) { lastOrbSound = now; sfx.orb(); }
}
/** groups: [{ targets: [el], cls: 'xp'|'coin', n }] — orbs curve from `from` to every visible target. */
export function flyOrbs(from, groups) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { groups.forEach((g) => g.targets.forEach((t) => t && arrive(t))); return Promise.resolve(); }
  const s = centerOf(from) || { x: innerWidth / 2, y: innerHeight * 0.6 };
  let delay = 0;
  groups.forEach((g) => g.targets.forEach((t) => {
    const c = centerOf(t); if (!c) return;
    for (let i = 0; i < g.n; i++) {
      const orb = document.createElement('i');
      orb.className = `orb ${g.cls}`; document.body.append(orb);
      const mx = s.x + (c.x - s.x) * 0.4 + (Math.random() - 0.5) * 140, my = s.y + (c.y - s.y) * 0.4 - 30 - Math.random() * 70;
      const a = orb.animate([
        { transform: `translate(${s.x}px,${s.y}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${mx}px,${my}px) scale(1.2)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${c.x}px,${c.y}px) scale(.55)`, opacity: 1 },
      ], { duration: 650 + Math.random() * 250, delay: delay + i * 80, easing: 'cubic-bezier(.45,0,.65,1)', fill: 'both' });
      a.onfinish = () => { orb.remove(); if (i === 0) arrive(t); };
    }
    delay += 60;
  }));
  return sleep(1150);
}

export function showReward(xp, coins, bxp = 0, bcoins = 0) {
  const el = document.createElement('div');
  el.className = 'reward-pop';
  el.innerHTML = `<span class="chip xp">+${xp} XP${bxp ? ` <small class="bonus">(+${bxp} pet)</small>` : ''}</span><span class="chip coin">${icon('coin', 14)} +${coins}${bcoins ? ` <small class="bonus">(+${bcoins})</small>` : ''}</span>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1700);
}

export function showLevelUp(level, petId, fx = 'default') {
  const o = document.createElement('div');
  o.className = 'lvl-overlay';
  o.innerHTML = `<div class="burst"></div><div class="inner"><div class="tag">Level Up!</div><div class="big">${level}</div>
    <div class="pets">${petHTML(petId, { size: 112 }).replace('class="pet ', 'data-static="1" class="pet ')}</div>
    <div class="muted">You reached level ${level}. Keep questing!</div><button class="btn primary" style="margin-top:14px">Continue</button></div>`;
  document.body.append(o);
  sfx.levelup();
  bringPetsToLife(o);
  const pet = o.querySelector('.pet');
  setTimeout(() => react(pet, 'lvl'), 250);
  confetti(90, fx === 'default' ? PET_CONFETTI[petId] || 'default' : fx);
  const loop = setInterval(() => { if (o.isConnected) react(pet, 'lvl'); }, 2300);
  return new Promise((resolve) => {
    const done = () => { clearInterval(loop); o.remove(); resolve(); };
    o.querySelector('button').onclick = done;
    setTimeout(done, 9000);
  });
}

const achQueue = [];
let achBusy = false;
export function showAchievements(list) {
  achQueue.push(...list);
  if (!achBusy) nextAch();
}
async function nextAch() {
  const a = achQueue.shift();
  if (!a) { achBusy = false; return; }
  achBusy = true;
  const el = document.createElement('div');
  el.className = 'ach-pop';
  el.innerHTML = `<div class="hex">${icon(a.icon, 26)}</div><div><small>Achievement unlocked</small><div class="display" style="font-weight:700">${esc(a.name)}</div>${a.reward_coins ? `<span class="chip coin" style="margin-top:4px">${icon('coin', 12)} +${a.reward_coins}</span>` : ''}</div>`;
  document.body.append(el);
  sfx.ach();
  confetti(30, 'stars', { x: innerWidth / 2, y: 60 });
  await sleep(4000);
  el.remove();
  nextAch();
}

/** Plays every celebration for a reward result. `fx` = equipped level-up effect. */
export async function celebrate(res, { petId, fx = 'default', from } = {}) {
  if (!res || res.rejected) return;
  if (res.xp != null) {
    showReward(res.xp, res.coins, res.bonus_xp, res.bonus_coins); sfx.xp();
    const xpT = [$('#hud-bar'), $('.hud-av'), ...$$('.pet[data-active="1"]'), ...$$('.stage .avatar')];
    await flyOrbs(from, [{ targets: xpT, cls: 'xp', n: 3 }, { targets: [$('#hud-coins')], cls: 'coin', n: 4 }]);
    sfx.coin();
  }
  if (res.leveled_up) {
    await sleep(900);
    reactActive('lvl');
    await showLevelUp(res.level_after, petId, fx);
  }
  if (res.achievements?.length) showAchievements(res.achievements);
}
