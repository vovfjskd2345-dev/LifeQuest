// Themes (full-app look) and Backgrounds (stage scenes behind the characters).
import { avatarHTML, petHTML } from './sprites.js';

export const THEMES = {
  theme_neon: {
    name: 'Neon Grid', scene: 'neon',
    vars: { '--bg0': '#070b1f', '--bg1': '#0e1636', '--card': 'rgba(17,25,56,.82)', '--card2': 'rgba(27,38,82,.7)', '--line': 'rgba(88,130,255,.28)', '--text': '#eaf0ff', '--muted': '#8e9bc9', '--a1': '#35f0ff', '--a2': '#8b5cf6', '--a3': '#ff4fd8', '--glow': 'rgba(53,240,255,.45)' },
  },
  theme_aurora: {
    name: 'Aurora Peak', scene: 'aurora',
    vars: { '--bg0': '#04141a', '--bg1': '#0a2a33', '--card': 'rgba(8,38,46,.82)', '--card2': 'rgba(16,64,74,.65)', '--line': 'rgba(92,255,176,.28)', '--text': '#e9fff6', '--muted': '#8cbfb2', '--a1': '#5cffb0', '--a2': '#9b7dff', '--a3': '#7ee8ff', '--glow': 'rgba(92,255,176,.42)' },
  },
  theme_forge: {
    name: 'Ember Forge', scene: 'forge',
    vars: { '--bg0': '#150706', '--bg1': '#2a0f0b', '--card': 'rgba(44,16,12,.84)', '--card2': 'rgba(74,28,20,.65)', '--line': 'rgba(255,140,60,.3)', '--text': '#fff1e6', '--muted': '#c99a86', '--a1': '#ff9a3c', '--a2': '#ff4d4d', '--a3': '#ffd23f', '--glow': 'rgba(255,140,60,.45)' },
  },
  theme_ocean: {
    name: 'Abyssal Reef', scene: 'ocean',
    vars: { '--bg0': '#03101f', '--bg1': '#072a45', '--card': 'rgba(6,36,62,.82)', '--card2': 'rgba(12,66,104,.62)', '--line': 'rgba(45,226,214,.28)', '--text': '#e6fbff', '--muted': '#86b6c9', '--a1': '#2de2d6', '--a2': '#3b82f6', '--a3': '#9bf0ff', '--glow': 'rgba(45,226,214,.42)' },
  },
  theme_void: {
    name: 'Void Station', scene: 'void',
    vars: { '--bg0': '#05050c', '--bg1': '#14102a', '--card': 'rgba(22,17,46,.84)', '--card2': 'rgba(38,28,78,.65)', '--line': 'rgba(179,136,255,.3)', '--text': '#f2ecff', '--muted': '#a597cf', '--a1': '#b388ff', '--a2': '#ff4fd8', '--a3': '#7df9ff', '--glow': 'rgba(179,136,255,.45)' },
  },
};

export const BACKGROUNDS = { bg_meadow: 'meadow', bg_cave: 'cave', bg_space: 'space', bg_castle: 'castle' };

export function themeStyle(id) {
  const t = THEMES[id] || THEMES.theme_neon;
  return Object.entries(t.vars).map(([k, v]) => `${k}:${v}`).join(';');
}

export function applyTheme(id) {
  const t = THEMES[id] || THEMES.theme_neon;
  const r = document.documentElement;
  Object.entries(t.vars).forEach(([k, v]) => r.style.setProperty(k, v));
  r.dataset.theme = id in THEMES ? id : 'theme_neon';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.vars['--bg0']);
}

// ---------- Scenes ------------------------------------------------------------

function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function stars(n, seed, ymax = 110, cls = 'tw', col = '#fff') {
  const r = rng(seed);
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = (r() * 320).toFixed(1), y = (r() * ymax).toFixed(1), s = r() < 0.2 ? 1.6 : 1;
    o += `<rect class="${r() < 0.4 ? cls : ''}" style="animation-delay:-${(r() * 4).toFixed(1)}s" x="${x}" y="${y}" width="${s}" height="${s}" fill="${col}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  }
  return o;
}

function buildings(seed, col, win, base = 152) {
  const r = rng(seed);
  let o = '', x = -5;
  while (x < 325) {
    const w = 18 + Math.floor(r() * 22), h = 30 + Math.floor(r() * 60);
    o += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${col}"/>`;
    for (let wy = base - h + 5; wy < base - 6; wy += 8) {
      for (let wx = x + 4; wx < x + w - 5; wx += 7) {
        if (r() < 0.45) o += `<rect x="${wx}" y="${wy}" width="3" height="4" fill="${win[Math.floor(r() * win.length)]}" opacity=".85"/>`;
      }
    }
    x += w + 2;
  }
  return o;
}

const SCENES = {
  neon: () => `<defs><linearGradient id="n-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090a2c"/><stop offset=".62" stop-color="#2b0f58"/><stop offset="1" stop-color="#8a2aa8"/></linearGradient>
    <linearGradient id="n-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe45c"/><stop offset="1" stop-color="#ff3f9a"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#n-sky)"/>${stars(40, 11, 90)}
    <circle cx="160" cy="112" r="38" fill="url(#n-sun)" opacity=".92"/>
    ${buildings(7, '#0a0b2b', ['#35f0ff', '#ff4fd8', '#ffe45c'])}
    <rect y="150" width="320" height="30" fill="#14062f"/>
    <g stroke="#35f0ff" stroke-width=".7" opacity=".55">${[-120, -80, -40, 0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].map((x) => `<path d="M160 150 L${x} 180"/>`).join('')}
    <path d="M0 156H320M0 164H320M0 174H320"/></g><rect y="149" width="320" height="2" fill="#35f0ff" opacity=".8"/>`,

  aurora: () => `<defs><linearGradient id="a-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020d17"/><stop offset="1" stop-color="#0b3b3a"/></linearGradient>
    <linearGradient id="a-b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cffb0" stop-opacity="0"/><stop offset=".5" stop-color="#5cffb0" stop-opacity=".6"/><stop offset="1" stop-color="#9b7dff" stop-opacity="0"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#a-sky)"/>${stars(55, 5, 100)}
    <path class="aur" d="M-10 40C60 10 110 90 180 40S280 20 330 50V100C260 70 220 110 150 80S40 60-10 90Z" fill="url(#a-b1)"/>
    <path class="aur aur2" d="M-10 60C70 30 120 100 200 55S290 45 330 70V110C250 90 200 125 140 100S30 85-10 110Z" fill="url(#a-b1)" opacity=".6"/>
    <path d="M-10 150L40 92 80 130 130 70 190 140 240 88 290 130 330 100V160H-10Z" fill="#11414c"/>
    <path d="M-10 160L30 118 70 150 120 105 170 152 230 112 280 150 330 125V165H-10Z" fill="#1c5e6a"/>
    <path d="M130 70l-14 20 8-4 6 6 6-6 8 4zM40 92l-10 16 7-3 4 4 5-4 6 3z" fill="#e8fbff"/>
    <rect y="150" width="320" height="30" fill="#d9f4ff"/><rect y="150" width="320" height="3" fill="#ffffff"/>
    ${[20, 54, 262, 296].map((x) => `<path d="M${x} 150l7-24 7 24zM${x + 1} 138l6-20 6 20z" fill="#0d3d3a"/>`).join('')}`,

  forge: () => `<defs><linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140303"/><stop offset="1" stop-color="#6a1a08"/></linearGradient>
    <radialGradient id="f-glow"><stop offset="0" stop-color="#ffb347" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="180" fill="url(#f-sky)"/><circle cx="160" cy="70" r="70" fill="url(#f-glow)"/>
    <path d="M30 152L120 62 148 52H172L200 62 290 152Z" fill="#2a0e0a"/><path d="M148 52h24l-4 12h-16z" fill="#ff8a2a"/>
    <path d="M160 64C158 90 150 110 140 152h14c4-30 8-60 6-88zM168 66c4 30 14 60 28 86h-16c-8-26-14-50-12-86z" fill="#ff7a1f" opacity=".85"/>
    <path d="M40 152L90 104 130 140 170 100 220 146 270 110 310 152Z" fill="#1d0a08"/>
    <rect y="150" width="320" height="30" fill="#1a0a08"/><path d="M20 160l30 4 20-3M120 168l40-4 30 6M230 160l30 3 40-4" stroke="#ff8a2a" stroke-width="1.5" fill="none" opacity=".8"/>
    ${[40, 90, 130, 180, 220, 270, 300].map((x, i) => `<circle class="emb" style="animation-delay:-${i * 0.7}s" cx="${x}" cy="150" r="1.6" fill="#ffb347"/>`).join('')}`,

  ocean: () => `<defs><linearGradient id="o-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b5f94"/><stop offset="1" stop-color="#031325"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#o-sky)"/>
    <g fill="#bff4ff" opacity=".12"><path d="M60 0h30l-40 160H20z"/><path d="M170 0h40l-30 160h-40z"/><path d="M270 0h24l-20 160h-30z"/></g>
    ${[30, 90, 140, 210, 255, 300].map((x, i) => `<circle class="bub" style="animation-delay:-${i * 0.9}s" cx="${x}" cy="150" r="${2 + (i % 3)}" fill="none" stroke="#bff4ff" stroke-width=".8" opacity=".7"/>`).join('')}
    <path d="M0 150C60 140 120 156 180 148S290 140 320 150V180H0Z" fill="#6d5a3d"/><rect y="152" width="320" height="28" fill="#8a7248"/>
    <path d="M20 152c0-20 6-22 6-34M26 134c-6-6-8-10-8-16M26 140c5-4 8-8 8-14" stroke="#ff6f91" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M280 152c0-18-6-24-6-34M274 132c6-4 8-8 8-14M274 140c-6-3-9-8-9-12" stroke="#ff9a3c" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M60 152c-4-14 4-22 0-34M70 152c4-12-4-20 0-30" stroke="#2de2a0" stroke-width="2.5" fill="none" stroke-linecap="round" class="sway"/>`,

  void: () => `<rect width="320" height="180" fill="#04040c"/>${stars(90, 3, 150)}
    <circle cx="255" cy="55" r="30" fill="#3a2a78"/><circle cx="246" cy="48" r="30" fill="#5a43b0" opacity=".75"/><ellipse cx="255" cy="58" rx="46" ry="8" fill="none" stroke="#b388ff" stroke-width="2" opacity=".6" transform="rotate(-14 255 58)"/>
    <g fill="#1a1736"><rect x="30" y="40" width="70" height="12"/><rect x="58" y="22" width="14" height="48"/><rect x="40" y="52" width="50" height="6"/></g>
    <g fill="#7df9ff"><rect x="34" y="44" width="4" height="3"/><rect x="46" y="44" width="4" height="3"/><rect x="78" y="44" width="4" height="3"/><rect x="88" y="44" width="4" height="3"/><rect x="62" y="28" width="6" height="3"/></g>
    <rect y="150" width="320" height="30" fill="#14102a"/><g stroke="#b388ff" stroke-width=".8" opacity=".6"><path d="M0 160H320M0 170H320M60 150V180M140 150V180M220 150V180M300 150V180"/></g><rect y="149" width="320" height="2" fill="#b388ff"/>`,

  meadow: () => `<defs><linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090e38"/><stop offset="1" stop-color="#274a86"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#m-sky)"/>${stars(45, 9, 90)}
    <circle cx="240" cy="48" r="22" fill="#fff7d6"/><circle cx="240" cy="48" r="34" fill="#fff7d6" opacity=".12"/>
    <path d="M-10 140C50 110 110 130 170 118S280 110 330 130V170H-10Z" fill="#13321f"/>
    <path d="M-10 156C60 136 130 150 200 140S290 136 330 148V180H-10Z" fill="#1d4a2b"/><rect y="152" width="320" height="28" fill="#235a33"/>
    ${[40, 100, 160, 220, 280].map((x, i) => `<circle class="ff" style="animation-delay:-${i * 0.8}s" cx="${x}" cy="${120 + (i % 3) * 12}" r="1.8" fill="#ffee7a"/>`).join('')}
    ${[14, 70, 128, 190, 244, 300].map((x) => `<path d="M${x} 158l2-8 2 8M${x + 5} 158l1-6 2 6" stroke="#2f7a45" stroke-width="1" fill="none"/>`).join('')}`,

  cave: () => `<defs><linearGradient id="c-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0620"/><stop offset="1" stop-color="#2a1250"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#c-bg)"/>
    <g fill="#08041a"><path d="M0 0h320v14l-20 16-14-14-24 26-20-24-28 30-24-28-30 24-26-28-30 26-26-20-24 20-20-14L0 36Z"/></g>
    <g class="crys"><path d="M30 152l8-44 8 44zM50 152l6-26 6 26z" fill="#35f0ff" opacity=".9"/><path d="M250 152l10-52 10 52zM276 152l6-30 6 30z" fill="#ff4fd8" opacity=".9"/><path d="M150 152l6-20 6 20z" fill="#8b5cf6"/></g>
    <circle cx="38" cy="130" r="24" fill="#35f0ff" opacity=".12"/><circle cx="262" cy="125" r="28" fill="#ff4fd8" opacity=".12"/>
    <rect y="150" width="320" height="30" fill="#1b1030"/><rect y="149" width="320" height="2" fill="#5b3aa8"/>`,

  space: () => `<defs><radialGradient id="s-neb" cx=".3" cy=".4"><stop offset="0" stop-color="#7b2cbf" stop-opacity=".7"/><stop offset="1" stop-color="#7b2cbf" stop-opacity="0"/></radialGradient>
    <radialGradient id="s-neb2" cx=".8" cy=".3"><stop offset="0" stop-color="#2cbcff" stop-opacity=".45"/><stop offset="1" stop-color="#2cbcff" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="180" fill="#05061a"/><ellipse cx="90" cy="70" rx="150" ry="80" fill="url(#s-neb)"/><ellipse cx="250" cy="55" rx="130" ry="70" fill="url(#s-neb2)"/>${stars(80, 21, 150)}
    <circle cx="70" cy="60" r="24" fill="#ff9a3c"/><path d="M52 52a24 24 0 0 1 36 8" stroke="#ffd29a" stroke-width="3" fill="none" opacity=".6"/><ellipse cx="70" cy="62" rx="40" ry="7" fill="none" stroke="#ffd29a" stroke-width="2" opacity=".7" transform="rotate(-18 70 62)"/>
    <circle cx="255" cy="40" r="9" fill="#c9d5ff"/><circle cx="252" cy="38" r="9" fill="#e8eeff" opacity=".6"/>
    <rect y="150" width="320" height="30" fill="#181a3a"/><rect y="149" width="320" height="2" fill="#2cbcff"/><g stroke="#2cbcff" stroke-width=".6" opacity=".5"><path d="M0 162H320M0 172H320M50 150V180M130 150V180M210 150V180M290 150V180"/></g>`,

  castle: () => `<defs><linearGradient id="k-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a7a"/><stop offset=".6" stop-color="#c26aa8"/><stop offset="1" stop-color="#ffb08a"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#k-sky)"/>${stars(18, 4, 50)}
    <g fill="#fff" opacity=".35"><ellipse cx="50" cy="60" rx="34" ry="8"/><ellipse cx="270" cy="84" rx="40" ry="9"/><ellipse cx="140" cy="38" rx="26" ry="6"/></g>
    <g class="flt"><path d="M110 112h100l-14 22h-72z" fill="#5b4636"/><g fill="#e9e1f7"><rect x="124" y="82" width="72" height="30"/><rect x="116" y="62" width="16" height="50"/><rect x="188" y="62" width="16" height="50"/><rect x="148" y="54" width="24" height="58"/></g>
    <g fill="#8b5cf6"><path d="M114 62l10-18 10 18zM186 62l10-18 10 18zM146 54l14-26 14 26z"/></g><g fill="#ffd23f"><rect x="156" y="70" width="8" height="10"/><rect x="120" y="76" width="6" height="8"/><rect x="194" y="76" width="6" height="8"/></g></g>
    <ellipse cx="160" cy="168" rx="190" ry="26" fill="#f6e4ff"/><ellipse cx="160" cy="160" rx="170" ry="14" fill="#ffffff" opacity=".85"/>`,
};

export function sceneHTML(name) {
  const body = (SCENES[name] || SCENES.neon)();
  return `<svg class="scene scene-${name}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

export function sceneFor(themeId, bgId) {
  if (bgId && BACKGROUNDS[bgId]) return BACKGROUNDS[bgId];
  return (THEMES[themeId] || THEMES.theme_neon).scene;
}

/** Whole-profile preview rendered with a theme's colours, scene and effects. */
export function themePreviewHTML(themeId, prof, equipped = []) {
  const t = THEMES[themeId] || THEMES.theme_neon;
  const scene = sceneFor(themeId, null);
  const pct = Math.round(prof.xpPct * 100);
  return `<div class="tprev" data-theme="${themeId}" style="${themeStyle(themeId)}">
    <div class="tprev-stage">${sceneHTML(scene)}<div class="fx-layer"></div>
      <div class="tprev-chars">${avatarHTML({ gender: prof.gender, appearance: prof.appearance, equipped, size: 78 })}${petHTML(prof.pet, { size: 58 }).replace('class="pet ', 'data-static="1" class="pet ')}</div>
    </div>
    <div class="tprev-ui">
      <div class="tprev-row"><b>${prof.name}</b><span class="chip">Lv ${prof.level}</span></div>
      <div class="xpbar"><i style="width:${pct}%"></i></div>
      <div class="tprev-row"><span class="tprev-title">${prof.title}</span><span class="chip coin">${prof.coins}</span></div>
      <div class="tprev-dots"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
  </div>`;
}
