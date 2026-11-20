// Pixel-art sprites: six companions + player avatar. Every sprite is a 16px grid
// rendered to crisp SVG rects, with separate layers (body / parts / eyes) so each
// creature can idle, blink and react in its own way.

import { sfx } from './sound.js';

const NS = 16;

// ---------- Companion definitions -----------------------------------------

export const PETS = {
  pet_gloop: {
    name: 'Gloop', species: 'Slime', personality: 'Bubbly & bouncy',
    blurb: 'Squishes with joy. Jiggles like jelly when you win.',
    pal: { o: '#0b4a6b', b: '#36d6e7', l: '#b4f7ff', d: '#1fa3c4' },
    body: [
      '................', '................', '................', '................',
      '.....oooooo.....', '...oollbbbboo...', '..oollbbbbbboo..', '.oollbbbbbbbboo.',
      '.olbbbbbbbbbbbo.', '.obbbbbbbbbbbbo.', 'obbbbbbbbbbbbbbo', 'obbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo', 'odbbbbbbbbbbbbdo', 'oddbbbbbbbbbbddo', '.oooooooooooooo.',
    ],
    detail: [[7, 12, 2, 1, '#0b4a6b'], [3, 12, 1, 1, '#ff9ecb'], [12, 12, 1, 1, '#ff9ecb']],
    parts: [{
      name: 'drip', behind: false, origin: '8px 4px',
      grid: [
        '................', '................', '.......oo.......', '......olbo......',
      ],
    }],
    eyes: {
      open: [[4, 9, 2, 3, '#0b2a45'], [10, 9, 2, 3, '#0b2a45'], [4, 9, 1, 1, '#fff'], [10, 9, 1, 1, '#fff']],
      closed: [[4, 11, 2, 1, '#0b2a45'], [10, 11, 2, 1, '#0b2a45']],
    },
  },

  pet_ember: {
    name: 'Ember', species: 'Fox', personality: 'Clever & cheeky',
    blurb: 'Always plotting the next adventure. Tail never stops wagging.',
    pal: { o: '#5a2a14', f: '#f08a24', w: '#fff1d6', r: '#ff9d8a', k: '#2b1308' },
    body: [
      '..oo........oo..', '..ofo......ofo..', '.ofrfo....ofrfo.', '.offffffffffffo.',
      '.offffffffffffo.', '.offffffffffffo.', '.offffffffffffo.', '.offwwffffwwffo.',
      '.offwwwwwwwwffo.', '..owwwwkkwwwwo..', '...offwwwwffo...', '...offwwwwffo...',
      '...offwwwwffo...', '...offwwwwffo...', '..okkko..okkko..', '..ooooo..ooooo..',
    ],
    detail: [],
    parts: [{
      name: 'tail', behind: false, origin: '13px 14px',
      grid: [
        '................', '................', '................', '................',
        '................', '................', '................', '................',
        '................', '................', '..............o.', '.............off',
        '.............ffo', '.............fwo', '..............oo', '................',
      ],
    }],
    eyes: {
      open: [[4, 5, 2, 2, '#2b1308'], [10, 5, 2, 2, '#2b1308'], [4, 5, 1, 1, '#fff'], [10, 5, 1, 1, '#fff']],
      closed: [[4, 6, 2, 1, '#2b1308'], [10, 6, 2, 1, '#2b1308']],
    },
  },

  pet_bit: {
    name: 'Bit', species: 'Robot', personality: 'Logical & loyal',
    blurb: 'Beeps in binary. Calculates your next level-up.',
    pal: { o: '#1b2340', s: '#8d9bb8', l: '#c7d2e8', d: '#5f6d8c', k: '#0c1a2e', c: '#35f0ff', y: '#ffd23f' },
    body: [
      '................', '.......oo.......', '...oooooooooo...', '..ollllllllsso..',
      '..osssssssssso..', '..oskkkkkkkkso..', '..oskkkkkkkkso..', '..oskkkkkkkkso..',
      '..osssssssssso..', '...oooooooooo...', '...osssssssso...', '...ossccccsso...',
      '...ossccccsso...', '...oddddddddo...', '...oddo..oddo...', '...oooo..oooo...',
    ],
    detail: [],
    parts: [
      {
        name: 'antenna', behind: false, origin: '8px 2px',
        grid: ['.......yy.......', '................'],
      },
      {
        name: 'arm-l', behind: false, origin: '2px 10px',
        grid: [
          '................', '................', '................', '................',
          '................', '................', '................', '................',
          '................', '................', '.ss.............', '.ss.............',
          '.ss.............', '.oo.............',
        ],
      },
      {
        name: 'arm-r', behind: false, origin: '13px 10px',
        grid: [
          '................', '................', '................', '................',
          '................', '................', '................', '................',
          '................', '................', '.............ss.', '.............ss.',
          '.............ss.', '.............oo.',
        ],
      },
    ],
    eyes: {
      open: [[5, 5, 2, 2, '#35f0ff'], [9, 5, 2, 2, '#35f0ff']],
      closed: [[5, 6, 2, 1, '#35f0ff'], [9, 6, 2, 1, '#35f0ff']],
    },
  },

  pet_mochi: {
    name: 'Mochi', species: 'Bunny', personality: 'Shy & sweet',
    blurb: 'A soft marshmallow of a bunny. Hops twice when happy.',
    pal: { o: '#6b4a5e', w: '#fff4f8', p: '#ffc2d6', g: '#e6d6ee' },
    body: [
      '................', '................', '................', '................',
      '................', '..oooooooooooo..', '.owwwwwwwwwwwwo.', '.owwwwwwwwwwwwo.',
      '.owwwwwwwwwwwwo.', '.owwppwwwwppwwo.', '.owwwwwwwwwwwwo.', '.owwwwwwwwwwwwo.',
      '.owwwwwwwwwwwwo.', '.ogwwwwwwwwwwgo.', '..ogggwwwwgggo..', '...oooooooooo...',
    ],
    detail: [[7, 9, 2, 1, '#e88aa8']],
    parts: [{
      name: 'ears', behind: true, origin: '8px 5px',
      grid: [
        '....oo....oo....', '...opwo..owpo...', '...opwo..owpo...', '...opwo..owpo...',
        '...opwo..owpo...',
      ],
    }],
    eyes: {
      open: [[4, 7, 2, 2, '#4a2c3f'], [10, 7, 2, 2, '#4a2c3f'], [4, 7, 1, 1, '#fff'], [10, 7, 1, 1, '#fff']],
      closed: [[4, 8, 2, 1, '#4a2c3f'], [10, 8, 2, 1, '#4a2c3f']],
    },
  },

  pet_nox: {
    name: 'Nox', species: 'Owl', personality: 'Wise & watchful',
    blurb: 'Stays up late guarding your streak. Never misses a thing.',
    pal: { o: '#2b1d3f', b: '#7b5ea7', l: '#b69be0', w: '#f7efd0', y: '#ffc233' },
    body: [
      '..oo........oo..', '..obo......obo..', '..obbbbbbbbbbo..', '.obbbbbbbbbbbbo.',
      '.obwwwwbbwwwwbo.', '.obwwwwbbwwwwbo.', '.obwwwwbbwwwwbo.', '.obwwwwbbwwwwbo.',
      '.obbbbbyybbbbbo.', '.obbbbbbbbbbbbo.', '.obbwwwwwwwwbbo.', '.obbwwwwwwwwbbo.',
      '.obbwwwwwwwwbbo.', '..obbwwwwwwbbo..', '...oooooooooo...', '....yyy..yyy....',
    ],
    detail: [],
    parts: [{
      name: 'wings', behind: false, origin: '8px 9px',
      grid: [
        '................', '................', '................', '................',
        '................', '................', '................', '................',
        '................', '.ooo........ooo.', '.olo........olo.', '.olo........olo.',
        '.obo........obo.', '..o..........o..',
      ],
    }],
    eyes: {
      open: [[4, 5, 2, 2, '#111'], [10, 5, 2, 2, '#111'], [4, 5, 1, 1, '#fff'], [10, 5, 1, 1, '#fff']],
      closed: [[3, 4, 4, 4, '#7b5ea7'], [9, 4, 4, 4, '#7b5ea7'], [3, 6, 4, 1, '#2b1d3f'], [9, 6, 4, 1, '#2b1d3f']],
    },
  },

  pet_drako: {
    name: 'Drako', species: 'Dragonling', personality: 'Bold & fiery',
    blurb: 'A tiny dragon with a huge heart. Sparks fly when you level up.',
    pal: { o: '#3a1450', p: '#9b4de3', l: '#c58bff', b: '#f2d9ff', h: '#ffd23f', r: '#ff7a45' },
    body: [
      '....h......h....', '....hh....hh....', '...ooppppppoo...', '..oppppppppppo..',
      '..oppppppppppo..', '..oppppppppppo..', '..oppppppppppo..', '..oppppppppppo..',
      '..ooppppppppoo..', '...oppbbbbppo...', '..oppbbbbbbppo..', '..oppbbbbbbppo..',
      '..oppbbbbbbppo..', '..ooppbbbbppoo..', '...oppo..oppo...', '...oooo..oooo...',
    ],
    detail: [[6, 7, 1, 1, '#3a1450'], [9, 7, 1, 1, '#3a1450']],
    parts: [
      {
        name: 'wings', behind: true, origin: '8px 9px',
        grid: [
          '................', '................', '................', '................',
          '................', '................', '................', '................',
          'o..............o', 'ol............lo', 'ool..........loo', 'olo..........olo',
          '.o............o.',
        ],
      },
      {
        name: 'tail', behind: false, origin: '13px 14px',
        grid: [
          '................', '................', '................', '................',
          '................', '................', '................', '................',
          '................', '................', '................', '................',
          '..............o.', '.............opo', '.............ppo', '..............oo',
        ],
      },
    ],
    eyes: {
      open: [[4, 4, 2, 2, '#ffd23f'], [10, 4, 2, 2, '#ffd23f'], [5, 4, 1, 2, '#111'], [10, 4, 1, 2, '#111']],
      closed: [[4, 5, 2, 1, '#3a1450'], [10, 5, 2, 1, '#3a1450']],
    },
  },
};

export const PET_IDS = Object.keys(PETS);
export const STARTER_PETS = ['pet_gloop', 'pet_ember', 'pet_bit'];

// ---------- Rendering helpers --------------------------------------------

function rectsFromGrid(grid, pal, y0 = 0) {
  let out = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !pal[ch]) { x++; continue; }
      let e = x;
      while (e < row.length && row[e] === ch) e++;
      out += `<rect x="${x}" y="${y + y0}" width="${e - x}" height="1" fill="${pal[ch]}"/>`;
      x = e;
    }
  });
  return out;
}

const rectList = (list) =>
  list.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('');

/** Returns the HTML of a companion. size = px of the 16px canvas. */
export function petHTML(id, { size = 96, active = false } = {}) {
  const p = PETS[id] || PETS.pet_gloop;
  const fx = size >= 48;
  const key = PETS[id] ? id : 'pet_gloop';
  const back = p.parts.filter((x) => x.behind)
    .map((x) => `<g class="part p-${x.name}" style="transform-origin:${x.origin}">${rectsFromGrid(x.grid, p.pal)}</g>`).join('');
  const front = p.parts.filter((x) => !x.behind)
    .map((x) => `<g class="part p-${x.name}" style="transform-origin:${x.origin}">${rectsFromGrid(x.grid, p.pal)}</g>`).join('');
  return `<div class="pet ${key} ${key.replace('_', '-')}" data-pet="${key}" ${active ? 'data-active="1"' : ''} style="--s:${size}px" role="button" aria-label="${p.name} the ${p.species}">
    <div class="pet-shadow"></div>${fx ? fxBack(key) : ''}
    <div class="pet-idle"><svg viewBox="0 0 ${NS} ${NS}" width="${size}" height="${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      ${back}<g class="body">${rectsFromGrid(p.body, p.pal)}${rectList(p.detail)}</g>${front}
      <g class="eyes-open">${rectList(p.eyes.open)}</g><g class="eyes-closed">${rectList(p.eyes.closed)}</g>
    </svg></div>${fx ? fxFront(key) : ''}
  </div>`;
}

// ---------- Companion effects: ambient particles, halo and a signature tap/level-up burst ----------

export const PET_FX = {
  pet_gloop: { name: 'Bubble trail', tap: 'Splash burst', tier: 1, n: 5, c: '#8ff3ff', br: '50%' },
  pet_ember: { name: 'Drifting embers', tap: 'Flame ring', tier: 1, n: 6, c: '#ffb347', br: '0' },
  pet_bit: { name: 'Data stream', tap: 'Glitch pulse', tier: 1, n: 6, c: '#35f0ff', br: '0' },
  pet_mochi: { name: 'Falling petals', tap: 'Petal shower', tier: 2, n: 8, c: '#ff9ecb', br: '50% 0' },
  pet_nox: { name: 'Starlight halo', tap: 'Shooting stars', tier: 2, n: 8, c: '#ffd96b', br: '0' },
  pet_drako: { name: 'Dragonfire aura', tap: 'Fire breath', tier: 3, n: 11, c: '#ff7a45', br: '0' },
};
export const TIER_LABEL = { 1: 'Basic effect', 2: 'Rare effect', 3: 'Legendary effect' };

function fxBack(id) {
  const f = PET_FX[id];
  return f && f.tier >= 2 ? `<div class="fx-halo t${f.tier}" style="--c:${f.c}"></div>` : '';
}
function fxFront(id) {
  const f = PET_FX[id]; if (!f) return '';
  let p = '';
  for (let i = 0; i < f.n; i++) {
    const t = 2.2 + (i % 3) * 0.8, x = 10 + ((i * 83) / f.n) + (i % 2) * 4, y = 12 + ((i * 37) % 80);
    p += `<i style="--x:${x.toFixed(0)}%;--y:${y}%;--d:-${((i * 0.73) % t).toFixed(2)}s;--t:${t.toFixed(1)}s;--k:${(i % 2 ? 1 : -1) * (6 + (i % 3) * 5)}px;--alt:${i % 2}"></i>`;
  }
  let b = '';
  for (let i = 0; i < 10; i++) b += `<i style="--a:${i * 36}deg"></i>`;
  return `<div class="fx-p">${p}</div><div class="pet-burst" style="--c:${f.c};--br:${f.br}">${b}</div>`;
}

// ---------- Companion behaviour (blink / tap / reactions) -----------------

const timers = new WeakMap();

function blinkOnce(el, times = 1) {
  let n = 0;
  const step = () => {
    if (!el.isConnected) return;
    el.classList.add('blink');
    setTimeout(() => {
      el.classList.remove('blink');
      n++;
      if (n < times) setTimeout(step, 130);
    }, 150);
  };
  step();
}

function scheduleBlink(el) {
  if (!el.isConnected) return;
  const t = setTimeout(() => {
    if (!el.isConnected) return;
    blinkOnce(el, 1);
    scheduleBlink(el);
  }, 5000 + Math.random() * 5000); // independent random 5–10 s
  timers.set(el, t);
}

export function react(el, kind) {
  if (!el) return;
  el.classList.remove('r-tap', 'r-xp', 'r-lvl');
  void el.offsetWidth; // restart animation
  el.classList.add('r-' + kind);
  const ms = kind === 'lvl' ? 1900 : kind === 'xp' ? 800 : 750;
  clearTimeout(el._rt);
  el._rt = setTimeout(() => el.classList.remove('r-' + kind), ms);
}

/** Make all companions inside `root` alive: random blinking + tap reactions. */
export function bringPetsToLife(root) {
  root.querySelectorAll('.pet').forEach((el) => {
    if (el._alive) return;
    el._alive = true;
    // desynchronise idle loops so creatures never move in lockstep
    el.querySelector('.pet-idle').style.animationDelay = `-${(Math.random() * 3).toFixed(2)}s`;
    el.querySelectorAll('.part').forEach((p) => { p.style.animationDelay = `-${(Math.random() * 2).toFixed(2)}s`; });
    scheduleBlink(el);
    if (el.dataset.static === '1') return;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      blinkOnce(el, 1 + Math.round(Math.random())); // 1–2 blinks
      react(el, 'tap');
      sfx.pet(el.dataset.pet);
    });
  });
}

/** Trigger a reaction on every active companion on screen. */
export function reactActive(kind) {
  document.querySelectorAll('.pet[data-active="1"]').forEach((el) => {
    react(el, kind);
    if (kind === 'lvl') blinkOnce(el, 2);
  });
}

// ---------- Player avatar ----------------------------------------------------

export const LOOKS = [
  { skin: '#f1c9a5', hair: '#4a3022', hairL: '#6e4a33', top: '#35c6e8' },
  { skin: '#f1c9a5', hair: '#e2b84a', hairL: '#f6d77a', top: '#8b5cf6' },
  { skin: '#c98f63', hair: '#1c1c2e', hairL: '#3a3a55', top: '#34d399' },
  { skin: '#8d5a3b', hair: '#1c1c2e', hairL: '#3a3a55', top: '#f472b6' },
  { skin: '#8d5a3b', hair: '#c2410c', hairL: '#ea6a2a', top: '#60a5fa' },
  { skin: '#ffe0cf', hair: '#7c3aed', hairL: '#a56bff', top: '#f59e0b' },
];

const AV = {
  base: [
    '................', '.....oooooo.....', '....ohhhhhho....', '...ohhHHhhhho...',
    '...ohhsssshho...', '...osssssssso...', '...osssssssso...', '...osssssssso...',
    '....osssssso....', '......osso......', '...ooccccccoo...', '.ooccccccccccoo.',
    '.occcccccccccco.', '.occcccccccccco.', '.ossccccccccsso.', '..oobbbbbbbboo..',
    '...obbbbbbbbo...', '...obbo..obbo...', '...obbo..obbo...', '..okkko..okkko..',
  ],
  bangsF: '...ohhhsssshho...',
  skirt: ['..oobbbbbbbboo..', '..obbbbbbbbbbo..', '.obbbbbbbbbbbbo.', '.oobbbbbbbbbboo.', '...osso..osso...', '..okkko..okkko..'],
  hairBackF: '.oh..........ho.',
};

// normalise rows (guards against typos)
AV.base = AV.base.map((r) => r.padEnd(16, '.').slice(0, 16));

const HATS = {
  cos_wizard: { y0: -6, pal: { p: '#6d3fd6', q: '#8b5cf6', y: '#ffd23f' }, grid: [
    '.......pp.......', '......pyqp......', '......pppp......', '.....pppppp.....',
    '....pppppppp....', '...pppppppppp...', '.yyyyyyyyyyyyyy.', '....pppppppp....',
  ] },
  cos_crown: { y0: -3, pal: { y: '#ffd23f', r: '#ff4d6d' }, grid: [
    '...y...yy...y...', '...yy.yyyy.yy...', '...yyyyyyyyyy...', '...yyryyyyryy...',
  ] },
};

let gid = 0;

/** Player avatar. equipped = array of item ids currently ON (cosmetics). */
export function avatarHTML({ gender = 'male', appearance = 0, equipped = [], size = 96, blink = true } = {}) {
  const L = LOOKS[appearance] || LOOKS[0];
  const pal = { o: '#1a1030', s: L.skin, h: L.hair, H: L.hairL, c: L.top, b: '#2a3a68', k: '#10162b' };
  const id = 'av' + (++gid);
  const on = new Set(equipped);
  let grid = AV.base.slice();
  if (gender === 'female') {
    grid[4] = AV.bangsF;
    grid = grid.slice(0, 15).concat(AV.skirt);
  }
  const back = [];
  if (on.has('cos_aura_cyan')) {
    back.push(`<defs><radialGradient id="${id}a"><stop offset="0" stop-color="#35f0ff" stop-opacity=".55"/><stop offset="1" stop-color="#35f0ff" stop-opacity="0"/></radialGradient></defs><ellipse class="aura" cx="8" cy="11" rx="11" ry="12.5" fill="url(#${id}a)"/>`);
  }
  if (on.has('cos_aura_flame')) {
    back.push(`<defs><radialGradient id="${id}f"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".6"/><stop offset=".6" stop-color="#b845ff" stop-opacity=".35"/><stop offset="1" stop-color="#b845ff" stop-opacity="0"/></radialGradient></defs><ellipse class="aura flame" cx="8" cy="11" rx="11.5" ry="13" fill="url(#${id}f)"/>`);
  }
  if (on.has('cos_cape')) {
    const cape = ['..rrrrrrrrrrrr..', '.rrrrrrrrrrrrrr.', '.rrrrrrrrrrrrrr.', '.rrrrrrrrrrrrrr.',
      'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'RRRRRRRRRRRRRRRR'];
    back.push(`<g class="cape">${rectsFromGrid(cape, { r: '#d6264a', R: '#8f1530' }, 10)}</g>`);
  }
  if (gender === 'female') {
    const hb = [];
    for (let i = 0; i < 8; i++) hb.push(AV.hairBackF);
    back.push(rectsFromGrid(hb, pal, 4));
  }
  const eyes = `<g class="eyes-open">${rectList([[5, 6, 1, 2, '#10162b'], [10, 6, 1, 2, '#10162b'], [5, 6, 1, 1, '#fff'], [10, 6, 1, 1, '#fff']])}</g>
    <g class="eyes-closed">${rectList([[5, 7, 1, 1, '#10162b'], [10, 7, 1, 1, '#10162b']])}</g>`;
  const mouth = rectList([[7, 8, 2, 1, '#a0524d']]);
  let front = '';
  if (on.has('cos_visor')) front += rectList([[3, 6, 10, 2, '#0c1a2e'], [4, 6, 8, 1, '#35f0ff'], [4, 7, 8, 1, '#1aa3c4']]);
  const hat = on.has('cos_crown') ? HATS.cos_crown : on.has('cos_wizard') ? HATS.cos_wizard : null;
  if (hat) front += rectsFromGrid(hat.grid, hat.pal, hat.y0);
  return `<div class="avatar" ${blink ? 'data-blink="1"' : ''} style="--s:${size}px"><svg viewBox="0 -6 16 26" width="${size * 0.62}" height="${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    ${back.join('')}${rectsFromGrid(grid, pal)}${eyes}${mouth}${front}
  </svg></div>`;
}

export function bringAvatarsToLife(root) {
  root.querySelectorAll('.avatar[data-blink="1"]').forEach((el) => {
    if (el._alive) return;
    el._alive = true;
    scheduleBlink(el);
  });
}

/** Utility for tests: every row must be 16 wide and eyes must sit on body pixels. */
export function validateSprites() {
  const problems = [];
  for (const [id, p] of Object.entries(PETS)) {
    const check = (name, grid) => grid.forEach((r, i) => { if (r.length !== NS) problems.push(`${id} ${name} row ${i} is ${r.length} wide`); });
    check('body', p.body);
    if (p.body.length !== NS) problems.push(`${id} body has ${p.body.length} rows`);
    p.parts.forEach((pt) => check(pt.name, pt.grid));
    p.eyes.open.forEach(([x, y, w, h]) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if ((p.body[yy] || '')[xx] === '.' || !(p.body[yy] || '')[xx]) problems.push(`${id} eye pixel ${xx},${yy} floats off the body`);
      }
    });
  }
  return problems;
}
