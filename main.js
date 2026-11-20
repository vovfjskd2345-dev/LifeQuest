// App shell: routing, HUD (level/XP/coins), bottom navigation, global state refresh.
import { initClient, isConfigured, DEMO, S, sb, syncTz, currentUser, bootstrap, equippedCosmetics, xpPct, addByCode, loadFriendships, pendingReviews } from './api.js';
import { applyTheme } from './themes.js';
import { avatarHTML, bringAvatarsToLife, petHTML, bringPetsToLife } from './sprites.js';
import { sfx, isMuted, setMuted } from './sound.js';
import { icon } from './icons.js';
import { $, esc, fmt, xpNeeded, toast, errorHTML, sleep, dateKey, weekStartKey } from './util.js';

const PAGES = {
  home: () => import('./pages/home.js'),
  quests: () => import('./pages/quests.js'),
  friends: () => import('./pages/friends.js'),
  friend: () => import('./pages/friend.js'),
  shop: () => import('./pages/shop.js'),
  profile: () => import('./pages/profile.js'),
  stats: () => import('./pages/stats.js'),
};
const NAV = [
  ['home', 'Home', 'home'], ['quests', 'Quests', 'sword'], ['friends', 'Friends', 'users'], ['shop', 'Shop', 'bag'], ['profile', 'Profile', 'user'],
];
const NAV_FOR = { friend: 'friends', stats: 'profile' };

const app = $('#app');
let cleanup = null;
let hudState = null;
let badgeTimer = null;

// ---------- Boot -----------------------------------------------------------------

async function boot() {
  if (!isConfigured) return setupScreen();
  try {
    await initClient();
    await currentUser();
    if (S.user) await bootstrap();
    sb.auth.onAuthStateChange((evt, session) => {
      if (evt === 'SIGNED_OUT') { S.user = null; location.hash = '#/auth'; route(); }
      else if (session?.user && !S.user) { S.user = session.user; }
    });
  } catch (e) {
    app.innerHTML = `<div class="auth">${errorHTML('Could not connect: ' + e.message)}</div>`;
    return;
  }
  document.addEventListener('click', (e) => { if (e.target.closest('.btn,.nav a,.seg button,.tabs button,.switch,.check')) sfx.tick(); }, true);
  window.addEventListener('hashchange', route);
  document.addEventListener('lq:me', onMeChanged);
  route();
}

function setupScreen() {
  app.innerHTML = `<div class="auth"><div class="logo"><h1>LIFEQUEST</h1><p>One last step: connect your backend</p></div>
    <div class="card stack"><h3>Setup needed</h3>
      <ol class="muted" style="margin:0;padding-left:18px;line-height:1.7">
        <li>Create a free project at supabase.com</li><li>Run <code>supabase/schema.sql</code> in the SQL Editor</li>
        <li>Put the project URL and anon key into <code>js/config.js</code></li><li>Reload this page</li></ol>
      <a class="btn primary block" href="?demo=1">Try the local demo</a>
      <p class="muted small" style="margin:0">Demo mode keeps everything in this browser only — nothing is shared or synced.</p></div></div>`;
}

// ---------- Day / week rollover ---------------------------------------------------------
// Quests are (re)created on the server when a page loads. If the app stays open past midnight (or the
// phone wakes up the next day) nothing would reload, so we watch the date and refresh by ourselves.
let dayKeyNow = dateKey(), weekKeyNow = weekStartKey();
async function checkRollover() {
  if (document.hidden || !S.user || !S.me) return;
  const d = dateKey();
  if (d === dayKeyNow) return;
  const newWeek = weekStartKey() !== weekKeyNow;
  dayKeyNow = d; weekKeyNow = weekStartKey();
  try { await syncTz(); } catch { /* non-fatal */ }
  toast(newWeek ? 'A new week has begun — daily and weekly quests reset!' : 'A new day has begun — daily quests reset!', 'good', 5000);
  if (['home', 'quests', 'stats', 'profile'].includes(parse().name)) route();
}
setInterval(checkRollover, 30000);
document.addEventListener('visibilitychange', checkRollover);

// ---------- Router -------------------------------------------------------------------

function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name = '', ...rest] = h.split('/');
  return { name: name || 'home', args: rest.map(decodeURIComponent) };
}

async function route() {
  const { name, args } = parse();
  cleanup?.(); cleanup = null;

  if (name === 'join') {
    localStorage.setItem('lq_invite', (args[0] || '').toUpperCase());
    if (S.user) { await applyInvite(); return; }
    location.hash = '#/auth'; return;
  }
  if (!S.user || !S.me) {
    if (S.user && !S.me) await bootstrap();
    if (!S.user || !S.me) return renderAuth();
  }
  if (name === 'auth') { location.hash = '#/home'; return; }
  if (!PAGES[name]) { location.hash = '#/home'; return; }

  if (!$('#view')) shell();
  document.documentElement.dataset.route = name;
  updateNav(NAV_FOR[name] || name);
  renderHUD(true);
  const view = $('#view');
  view.innerHTML = '<div class="page"><div class="spinner"></div></div>';
  try {
    const mod = await PAGES[name]();
    if (parse().name !== name) return; // navigated away while loading
    view.innerHTML = '<div class="page"></div>';
    cleanup = (await mod.render(view.firstElementChild, { args })) || null;
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="page">${errorHTML(e.message || 'Something went wrong')}</div>`;
    view.querySelector('[data-retry]')?.addEventListener('click', route);
  }
  refreshBadges();
}

async function renderAuth() {
  document.documentElement.dataset.route = 'auth';
  applyTheme('theme_neon');
  hudState = null;
  const mod = await import('./pages/auth.js');
  app.innerHTML = '';
  cleanup = (await mod.render(app, { onDone: async () => { await bootstrap(); await applyInviteIfAny(); location.hash = '#/home'; route(); } })) || null;
}

async function applyInviteIfAny() {
  const code = localStorage.getItem('lq_invite');
  if (!code) return;
  localStorage.removeItem('lq_invite');
  try { const who = await addByCode(code); toast(`You are now friends with ${who}!`, 'good'); } catch (e) { toast(e.message, 'bad'); }
}
async function applyInvite() { await applyInviteIfAny(); location.hash = '#/friends'; }

// ---------- Shell: HUD + nav ------------------------------------------------------------

function shell() {
  app.innerHTML = `${DEMO ? '<div class="demo-banner">DEMO MODE — data is stored only in this browser</div>' : ''}
    <header class="hud" id="hud"></header><main id="view"></main>
    <nav class="nav" aria-label="Main">${NAV.map(([k, label, ic]) => `<a href="#/${k}" data-nav="${k}" aria-label="${label}">${icon(ic, 22)}<span>${label}</span></a>`).join('')}</nav>`;
}

function updateNav(active) {
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === active));
}

function onMeChanged() {
  if (!S.me || !$('#hud')) return;
  applyTheme(S.me.theme);
  renderHUD(false);
}

function renderHUD(first) {
  const hud = $('#hud');
  if (!hud || !S.me) return;
  const me = S.me;
  applyTheme(me.theme);
  const need = xpNeeded(me.level);
  const pct = Math.round(xpPct() * 100);
  const avKey = `${me.gender}|${me.appearance}|${me.active_companion}|${equippedCosmetics().join(',')}`;
  if (!hud.firstChild || hudState?.avKey !== avKey) {
    hud.innerHTML = `<a class="hud-av" href="#/profile" aria-label="Profile">${avatarHTML({ gender: me.gender, appearance: me.appearance, equipped: equippedCosmetics(), size: 76 })}${petHTML(me.active_companion, { size: 30, active: true }).replace('class="pet ', 'data-static="1" class="pet ')}</a>
      <div class="hud-main"><div class="hud-name"><span>${esc(me.character_name)}</span><span class="chip xp" id="hud-lv">Lv ${me.level}</span></div>
        <div class="xpbar"><i id="hud-bar" style="width:${first ? pct : hudState?.pct ?? pct}%"></i></div>
        <div class="xptext"><span id="hud-xp">${fmt(me.xp)} / ${fmt(need)} XP</span><span>${me.streak > 0 ? icon('flame', 11) + ' ' + me.streak + ' day streak' : ''}</span></div></div>
      <a class="chip coin" id="hud-coins" href="#/shop" style="font-size:15px;padding:6px 11px;text-decoration:none">${icon('coin', 16)}<span>${fmt(me.coins)}</span></a>
      <button class="hud-snd" id="snd" aria-label="Toggle sound">${icon(isMuted() ? 'mute' : 'volume', 18)}</button>`;
    $('#snd').onclick = (e) => { setMuted(!isMuted()); e.currentTarget.innerHTML = icon(isMuted() ? 'mute' : 'volume', 18); };
    bringAvatarsToLife(hud); bringPetsToLife(hud);
  }
  const bar = $('#hud-bar'), lv = $('#hud-lv'), xp = $('#hud-xp'), coins = $('#hud-coins span');
  if (xp) xp.textContent = `${fmt(me.xp)} / ${fmt(need)} XP`;
  if (hudState && me.level > hudState.level && bar) {
    // level-up: fill to the brim, flash, then restart from zero to the new progress
    bar.style.width = '100%';
    setTimeout(async () => {
      bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = '';
      lv.textContent = `Lv ${me.level}`;
      await sleep(30); bar.style.width = pct + '%';
    }, 950);
  } else if (bar) { bar.style.width = pct + '%'; if (lv) lv.textContent = `Lv ${me.level}`; }
  if (coins) tween(coins, hudState?.coins ?? me.coins, me.coins);
  hudState = { level: me.level, pct, coins: me.coins, avKey };
}

function tween(el, from, to) {
  if (from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 700;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function refreshBadges() {
  clearTimeout(badgeTimer);
  if (!S.user || !$('.nav')) return;
  try {
    const [fr, rev] = await Promise.all([loadFriendships(), pendingReviews()]);
    setBadge('friends', fr.incoming.length);
    setBadge('quests', rev.length);
  } catch { /* badges are best-effort */ }
  badgeTimer = setTimeout(refreshBadges, 60000);
}
function setBadge(key, n) {
  const a = document.querySelector(`.nav a[data-nav="${key}"]`);
  if (!a) return;
  a.querySelector('.dot')?.remove();
  if (n > 0) a.insertAdjacentHTML('beforeend', `<span class="dot">${n}</span>`);
}
export { refreshBadges };

boot();
