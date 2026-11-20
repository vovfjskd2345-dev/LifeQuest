// Profile: character, title, companion, equipped cosmetics, achievements, customisation.
import { S, perkText, equip, updateProfile, refreshMe, equippedCosmetics, xpPct, shopById, signOut, inviteLink } from '../api.js';
import { safely } from '../actions.js';
import { avatarHTML, petHTML, bringPetsToLife, bringAvatarsToLife, PETS, LOOKS } from '../sprites.js';
import { sceneHTML, sceneFor } from '../themes.js';
import { icon } from '../icons.js';
import { esc, fmt, xpNeeded, $, $$, openSheet, toast, showLevelUp, showAchievements } from '../util.js';
import { DEMO } from '../api.js';
import { isMuted, setMuted } from '../sound.js';
import { reactActive } from '../sprites.js';

export function achGrid(ach, unlocked, onClick = true) {
  return `<div class="ach-grid">${ach.map((a) => { const on = unlocked.has(a.id); return `<div class="ach ${on ? '' : 'locked'}" data-ach="${a.id}"><div class="hex">${icon(on ? a.icon : 'lock', 24)}</div><b>${esc(a.name)}</b><small>${on ? 'Unlocked' : esc(a.description)}</small></div>`; }).join('')}</div>`;
}
export function achDetail(a, unlocked) {
  const on = unlocked.has(a.id);
  openSheet(`<div class="center stack" style="align-items:center"><div class="ach ${on ? '' : 'locked'}" style="border:0;background:none"><div class="hex" style="width:72px;height:72px">${icon(on ? a.icon : 'lock', 36)}</div></div>
    <h2>${esc(a.name)}</h2><p class="muted" style="margin:0">${esc(a.description)}</p><div class="chip ${on ? 'xp' : ''}">${on ? 'Unlocked' : 'Locked'}</div>
    ${a.reward_coins ? `<div class="chip coin">${icon('coin', 12)} Reward ${a.reward_coins}</div>` : ''}<button class="btn block" data-close>Close</button></div>`, { center: true });
}

export async function render(root) {
  const draw = () => {
    const me = S.me, need = xpNeeded(me.level), eq = S.inv.filter((i) => i.equipped && !['theme', 'title', 'companion'].includes(shopById(i.item_id)?.category));
    const pet = PETS[me.active_companion] || PETS.pet_gloop;
    const unlockedN = S.unlocked.size;
    root.innerHTML = `<div class="stage" style="height:230px">${sceneHTML(sceneFor(me.theme, me.background))}<div class="shade"></div>
        <div class="chars">${avatarHTML({ gender: me.gender, appearance: me.appearance, equipped: equippedCosmetics(), size: 110 })}${petHTML(me.active_companion, { size: 70, active: true })}</div></div>
      <div class="card glow" style="margin-top:-24px;position:relative">
        <div class="row between"><div><h1 style="font-size:22px">${esc(me.character_name)}</h1><div class="muted small">@${esc(me.username)}</div></div><button class="btn sm" id="edit">${icon('edit', 15)} Edit</button></div>
        <div class="row wrap" style="margin:10px 0"><span class="chip">${icon('crown', 12)} ${esc(shopById(me.title)?.name || 'Novice Adventurer')}</span><span class="chip xp">Level ${me.level}</span><span class="chip">${icon('paw', 12)} ${esc(pet.name)}</span></div>
        <div class="small" style="color:var(--a1);margin-bottom:8px">${icon('bolt', 12)} Companion perk: ${esc(perkText(me.active_companion))}</div>
        ${me.bio ? `<p class="muted" style="margin:0 0 10px">${esc(me.bio)}</p>` : ''}
        <div class="xpbar big"><i style="width:${Math.round(xpPct() * 100)}%"></i></div><div class="xptext"><span>${fmt(me.xp)} / ${fmt(need)} XP</span><span>${fmt(need - me.xp)} to next level</span></div></div>
      <div class="statgrid" style="margin-top:12px"><div class="stat"><span>${icon('check', 14)} Quests done</span><b>${fmt(me.quests_completed)}</b></div><div class="stat"><span>${icon('flame', 14)} Best streak</span><b>${me.best_streak}</b></div></div>
      <a class="btn primary block" style="margin-top:12px" href="#/stats">${icon('chart', 18)} View full stats</a>
      <div class="section-h"><h2>${icon('gift', 18)} Equipped</h2></div>
      <div class="card stack" style="gap:8px">${eq.length ? eq.map((i) => { const it = shopById(i.item_id); return `<div class="row between"><span>${esc(it.name)}</span><button class="switch on" data-off="${it.id}" aria-label="Unequip ${esc(it.name)}"></button></div>`; }).join('') : '<span class="muted small">No cosmetics equipped. Visit the shop!</span>'}
        <div class="row between"><span>Theme: ${esc(shopById(me.theme)?.name || '')}</span><a class="small" style="color:var(--a1)" href="#/shop">Change</a></div></div>
      <div class="section-h"><h2>${icon('trophy', 18)} Achievements</h2><span class="small muted">${unlockedN}/${S.ach.length}</span></div>${achGrid(S.ach, S.unlocked)}
      <div class="section-h"><h2>${icon('users', 18)} Invite</h2></div>
      <div class="card row between"><div><b>Code ${esc(me.invite_code)}</b><div class="small muted">Share your invite link with friends</div></div><button class="btn sm primary" id="share">${icon('share', 15)} Share</button></div>
      <div class="section-h"><h2>${icon('volume', 18)} Sound</h2></div>
      <div class="card row between"><span>Sound effects</span><button class="switch ${isMuted() ? '' : 'on'}" id="snd2" aria-label="Sound effects"></button></div>
      ${DEMO ? `<div class="section-h"><h2>${icon('spark', 18)} Demo tools</h2></div><div class="card stack"><div class="small muted">Preview animations without changing your progress.</div>
        <button class="btn block" id="pv-lvl">Preview level-up</button><button class="btn block" id="pv-ach">Preview achievement</button></div>` : ''}
      <button class="btn danger block" style="margin-top:24px" id="logout">${icon('logout', 16)} Log out</button>`;
    bringPetsToLife(root); bringAvatarsToLife(root);
    $$('[data-ach]', root).forEach((e) => (e.onclick = () => achDetail(S.ach.find((a) => a.id === e.dataset.ach), S.unlocked)));
    $$('[data-off]', root).forEach((b) => (b.onclick = async () => { await safely(() => equip(b.dataset.off, false)); await refreshMe(); draw(); }));
    $('#edit', root).onclick = editSheet;
    $('#snd2', root).onclick = (e) => { setMuted(!isMuted()); e.currentTarget.classList.toggle('on', !isMuted()); };
    const pl = $('#pv-lvl', root); if (pl) pl.onclick = () => { reactActive('lvl'); showLevelUp(S.me.level + 1, S.me.active_companion); };
    const pa = $('#pv-ach', root); if (pa) pa.onclick = () => showAchievements([{ id: 'x', name: 'Preview Achievement', icon: 'trophy', reward_coins: 25 }]);
    $('#logout', root).onclick = async () => { await signOut(); location.hash = '#/auth'; };
    $('#share', root).onclick = async () => {
      const url = inviteLink(), text = `Join me on LifeQuest! Use code ${S.me.invite_code}: ${url}`;
      try { if (navigator.share) await navigator.share({ title: 'LifeQuest', text, url }); else { await navigator.clipboard.writeText(text); toast('Invite link copied!', 'good'); } } catch { /* cancelled */ }
    };
  };

  function editSheet() {
    let look = S.me.appearance;
    const s = openSheet(`<h2>Edit profile</h2><div class="stack" style="margin-top:10px">
      <div class="field"><label for="e-name">Character name</label><input id="e-name" maxlength="24" value="${esc(S.me.character_name)}"></div>
      <div class="field"><label for="e-bio">Bio</label><textarea id="e-bio" maxlength="160" placeholder="Your motto…">${esc(S.me.bio)}</textarea></div>
      <div class="field"><span class="lbl">Appearance</span><div class="looks" id="e-looks"></div></div>
      <div class="field"><span class="lbl">Title</span><select id="e-title">${S.inv.filter((i) => shopById(i.item_id)?.category === 'title').map((i) => `<option value="${i.item_id}" ${S.me.title === i.item_id ? 'selected' : ''}>${esc(shopById(i.item_id).name)}</option>`).join('')}</select></div>
      <div class="err hide" id="e-err"></div><div class="row"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="e-save">Save</button></div></div>`);
    const looks = () => { $('#e-looks', s.el).innerHTML = LOOKS.map((_, i) => `<button class="look ${look === i ? 'on' : ''}" data-l="${i}">${avatarHTML({ gender: S.me.gender, appearance: i, size: 70, blink: false })}</button>`).join(''); $$('[data-l]', s.el).forEach((b) => (b.onclick = () => { look = +b.dataset.l; looks(); })); };
    looks();
    $('#e-save', s.el).onclick = async () => {
      const err = $('#e-err', s.el);
      try {
        await updateProfile($('#e-name', s.el).value, look, $('#e-bio', s.el).value);
        const t = $('#e-title', s.el).value; if (t !== S.me.title) await equip(t, true);
        await refreshMe(); s.close(); toast('Profile saved', 'good'); draw();
      } catch (e) { err.textContent = e.message; err.classList.remove('hide'); }
    };
  }
  draw();
}
