// Shop: categories, confirm-before-buy, equip toggles, full-profile theme previews.
import { S, perkText, purchase, equip, owns, isOn, equippedCosmetics, xpPct, shopById, refreshMe } from '../api.js';
import { withReward, safely } from '../actions.js';
import { avatarHTML, petHTML, bringPetsToLife, bringAvatarsToLife, PETS, PET_FX, TIER_LABEL } from '../sprites.js';
import { THEMES, BACKGROUNDS, themePreviewHTML, sceneHTML, sceneFor, applyTheme } from '../themes.js';
import { icon } from '../icons.js';
import { sfx } from '../sound.js';
import { esc, fmt, $, $$, openSheet, toast, confetti, showAchievements } from '../util.js';

const CATS = [['companion', 'Companions'], ['cosmetic', 'Cosmetics'], ['theme', 'Themes'], ['background', 'Backgrounds'], ['title', 'Titles'], ['other', 'Effects']];

export async function render(root) {
  let cat = sessionStorage.getItem('lq_shopcat') || 'companion';

  const status = (it) => owns(it.id) ? (isOn(it.id) ? 'equipped' : 'owned') : (S.me.level < it.min_level ? 'locked' : 'buy');
  const profView = (themeId) => ({ name: S.me.character_name, level: S.me.level, coins: S.me.coins, gender: S.me.gender, appearance: S.me.appearance, pet: S.me.active_companion, title: shopById(S.me.title)?.name || '', xpPct: xpPct() });

  function preview(it) {
    const me = S.me;
    switch (it.category) {
      case 'companion': return petHTML(it.id, { size: 74 });
      case 'cosmetic': return avatarHTML({ gender: me.gender, appearance: me.appearance, equipped: [it.id], size: 100 });
      case 'theme': return `<div style="position:absolute;inset:0">${sceneHTML(THEMES[it.id].scene)}</div>${avatarHTML({ gender: me.gender, appearance: me.appearance, size: 70 })}`;
      case 'background': return `${sceneHTML(BACKGROUNDS[it.id])}${avatarHTML({ gender: me.gender, appearance: me.appearance, equipped: equippedCosmetics(), size: 70 })}`;
      case 'title': return `<div class="ribbon">${esc(it.name)}</div>`;
      default: return `<div class="fx-prev">${'<i></i>'.repeat(5)}</div>`;
    }
  }

  function card(it) {
    const st = status(it);
    const btn = st === 'equipped' ? `<button class="btn sm good" data-eq="${it.id}" data-on="0">${icon('check', 14)} Equipped</button>`
      : st === 'owned' ? `<button class="btn sm primary" data-eq="${it.id}" data-on="1">Equip</button>`
      : st === 'locked' ? `<button class="btn sm" disabled>${icon('lock', 14)} Level ${it.min_level}</button>`
      : `<button class="btn sm primary" data-buy="${it.id}">${icon('coin', 14)} ${fmt(it.price)}</button>`;
    const toggle = owns(it.id) && !['companion'].includes(it.category) && !['theme_neon', 'title_novice'].includes(it.id)
      ? `<button class="switch ${isOn(it.id) ? 'on' : ''}" data-eq="${it.id}" data-on="${isOn(it.id) ? 0 : 1}" aria-label="Toggle ${esc(it.name)}"></button>` : '';
    return `<div class="item ${st}"><div class="item-prev" ${it.category === 'theme' || it.category === 'background' ? '' : ''}>${st === 'locked' ? `<span class="lockbadge">${icon('lock', 11)} Lv ${it.min_level}</span>` : ''}${preview(it)}</div>
      <div class="item-body"><div class="row between"><h3>${esc(it.name)}</h3>${toggle}</div><p>${esc(it.description)}</p>${PET_FX[it.id] ? `<div class="perkline">${icon('bolt', 12)} ${esc(perkText(it.id))}</div><div class="fxline t${PET_FX[it.id].tier}">${icon('spark', 12)} <b>${TIER_LABEL[PET_FX[it.id].tier]}</b><br>${PET_FX[it.id].name} · ${PET_FX[it.id].tap}</div>` : ''}
        <div class="row between wrap">${owns(it.id) ? `<span class="pill completed">${st === 'equipped' ? 'ON' : 'Purchased'}</span>` : '<span class="pill expired">Locked</span>'}${it.category === 'theme' ? `<button class="btn sm ghost" data-prev="${it.id}">${icon('eye', 14)} Preview</button>` : ''}</div>
        ${btn}</div></div>`;
  }

  function draw() {
    const items = S.shop.filter((i) => i.category === cat);
    root.innerHTML = `<div class="page-title"><h2>Shop</h2><span class="chip coin" style="font-size:15px">${icon('coin', 16)} ${fmt(S.me.coins)}</span></div>
      <div class="tabs">${CATS.map(([k, l]) => `<button data-cat="${k}" class="${cat === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="shop-grid" style="margin-top:10px">${items.map(card).join('')}</div>`;
    $$('[data-cat]', root).forEach((b) => (b.onclick = () => { cat = b.dataset.cat; sessionStorage.setItem('lq_shopcat', cat); draw(); }));
    bringPetsToLife(root); bringAvatarsToLife(root);
  }

  function buySheet(it) {
    const after = S.me.coins - it.price, short = after < 0;
    const s = openSheet(`<h2>Confirm purchase</h2>
      <div class="card center" style="margin:12px 0"><div class="item-prev" style="border-radius:12px;height:130px">${preview(it)}</div><h3 style="margin-top:10px">${esc(it.name)}</h3><div class="small muted">${esc(it.description)}</div></div>
      <div class="confirm-row"><span>Item price</span><b>${icon('coin', 14)} ${fmt(it.price)}</b></div>
      <div class="confirm-row"><span>Your Coins</span><b>${icon('coin', 14)} ${fmt(S.me.coins)}</b></div>
      <div class="confirm-row"><span>Remaining after purchase</span><b style="${short ? 'color:var(--bad)' : ''}">${icon('coin', 14)} ${fmt(after)}</b></div>
      ${short ? `<div class="err" style="margin-top:10px">You need ${fmt(-after)} more Coins. Complete quests to earn them!</div>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="yes" ${short ? 'disabled' : ''}>Buy now</button></div>`, { center: true });
    bringPetsToLife(s.el); bringAvatarsToLife(s.el);
    $('#yes', s.el).onclick = async (e) => {
      e.target.disabled = true; // blocks double-tap duplicates; the server also enforces ownership
      try {
        const res = await withReward(() => purchase(it.id), { silent: true });
        s.close(); confetti(50); sfx.buy(); toast(`${it.name} purchased!`, 'good');
        if (res?.achievements?.length) showAchievements(res.achievements);
        draw();
      } catch { s.close(); await refreshMe(); draw(); }
    };
  }

  function themeSheet(it) {
    const s = openSheet(`<h2>${esc(it.name)}</h2><p class="muted small" style="margin:4px 0 12px">Live preview of your profile with this theme.</p>
      ${themePreviewHTML(it.id, profView(it.id), equippedCosmetics())}
      <div class="row" style="margin-top:14px"><button class="btn grow" data-close>Close</button>${owns(it.id) ? `<button class="btn primary grow" id="act">${isOn(it.id) ? 'Equipped' : 'Equip theme'}</button>` : `<button class="btn primary grow" id="act">${icon('coin', 14)} Buy ${fmt(it.price)}</button>`}</div>`);
    bringPetsToLife(s.el); bringAvatarsToLife(s.el);
    $('#act', s.el).onclick = async () => { s.close(); if (owns(it.id)) { if (!isOn(it.id)) await toggle(it.id, true); } else if (S.me.level < it.min_level) toast(`Requires level ${it.min_level}`, 'bad'); else buySheet(it); };
  }

  async function toggle(id, on) {
    await safely(() => equip(id, on));
    await refreshMe(); draw();
  }

  root.addEventListener('click', (e) => {
    const buy = e.target.closest('[data-buy]'), eq = e.target.closest('[data-eq]'), pv = e.target.closest('[data-prev]');
    if (buy) buySheet(shopById(buy.dataset.buy));
    else if (eq) toggle(eq.dataset.eq, eq.dataset.on === '1');
    else if (pv) themeSheet(shopById(pv.dataset.prev));
  });
  draw();
}
