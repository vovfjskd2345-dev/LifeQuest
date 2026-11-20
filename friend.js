// A friend's profile: avatar, companion, achievements, side-by-side comparison, cheers.
import { S, friendBundle, sendCheer, loadFriendships, removeFriend, shopById } from '../api.js';
import { safely } from '../actions.js';
import { avatarHTML, petHTML, bringPetsToLife, bringAvatarsToLife, PETS } from '../sprites.js';
import { sceneHTML, sceneFor } from '../themes.js';
import { icon } from '../icons.js';
import { esc, fmt, $, $$, loadingHTML, errorHTML, toast, confirmSheet } from '../util.js';
import { achGrid, achDetail } from './profile.js';

export async function render(root, { args }) {
  root.innerHTML = loadingHTML(3);
  let b;
  try { b = await friendBundle(args[0]); } catch (e) { root.innerHTML = errorHTML(e.message); return; }
  const p = b.profile;
  if (!p) { root.innerHTML = errorHTML('Player not found', false); return; }
  const me = S.me, cos = b.inv.filter((i) => i.equipped && /^cos_/.test(i.item_id)).map((i) => i.item_id);
  const fr = (await loadFriendships()).friends.find((r) => r.other?.id === p.id);
  const isFriend = !!fr;
  const cmp = (label, a, c) => { const m = Math.max(1, a, c); return `<div class="cmp-val l">${fmt(a)}</div><div class="cmp-lbl">${label}</div><div class="cmp-val r">${fmt(c)}</div><div class="cmp-bar l"><i style="width:${(a / m) * 100}%"></i></div><div></div><div class="cmp-bar r"><i style="width:${(c / m) * 100}%"></i></div>`; };
  const KINDS = [['fire', '🔥'], ['muscle', '💪'], ['star', '⭐'], ['clap', '👏']];
  const cheered = b.cheers.some((c) => c.cheer_date === new Date().toISOString().slice(0, 10));
  const pet = PETS[p.active_companion] || PETS.pet_gloop;
  root.innerHTML = `<div class="row" style="margin-bottom:8px"><a class="btn sm" href="#/friends">${icon('arrowup', 14).replace('<svg', '<svg style="transform:rotate(-90deg)"')} Back</a></div>
    <div class="stage">${sceneHTML(sceneFor(p.theme, p.background))}<div class="shade"></div><div class="chars">${avatarHTML({ gender: p.gender, appearance: p.appearance, equipped: cos, size: 100 })}${petHTML(p.active_companion, { size: 74 })}</div></div>
    <div class="card glow" style="margin-top:-22px;position:relative"><h1 style="font-size:21px">${esc(p.character_name)}</h1><div class="muted small">@${esc(p.username)} · ${esc(shopById(p.title)?.name || '')}</div>
      <div class="row wrap" style="margin-top:8px"><span class="chip xp">Level ${p.level}</span><span class="chip">${icon('paw', 12)} ${esc(pet.name)}</span><span class="chip">${icon('flame', 12)} ${p.streak} streak</span></div>${p.bio ? `<p class="muted" style="margin:10px 0 0">${esc(p.bio)}</p>` : ''}</div>
    ${isFriend ? `<div class="section-h"><h2>${icon('heart', 18)} Motivate</h2></div><div class="card row between">${KINDS.map(([k, e]) => `<button class="cheer-btn" data-cheer="${k}" ${cheered ? 'disabled' : ''} style="font-size:24px">${e}</button>`).join('')}</div><div class="small muted center" style="margin-top:6px">${cheered ? 'You already cheered today — come back tomorrow!' : 'Send a cheer (once per day)'}</div>` : ''}
    <div class="section-h"><h2>${icon('chart', 18)} Compare</h2></div>
    <div class="card"><div class="row between small" style="margin-bottom:10px"><b>You</b><b>${esc(p.character_name)}</b></div><div class="compare">
      ${cmp('Level', me.level, p.level)}${cmp('Total XP', me.total_xp, p.total_xp)}${cmp('Quests', me.quests_completed, p.quests_completed)}${cmp('Best streak', me.best_streak, p.best_streak)}${cmp('Achievements', S.unlocked.size, b.unlocked.size)}</div></div>
    <div class="section-h"><h2>${icon('trophy', 18)} Achievements</h2><span class="small muted">${b.unlocked.size}/${S.ach.length}</span></div>${achGrid(S.ach, b.unlocked)}
    ${isFriend ? `<button class="btn danger block" style="margin-top:22px" id="rm">Remove friend</button>` : ''}`;
  bringPetsToLife(root); bringAvatarsToLife(root);
  $$('[data-ach]', root).forEach((e) => (e.onclick = () => achDetail(S.ach.find((a) => a.id === e.dataset.ach), b.unlocked)));
  $$('[data-cheer]', root).forEach((btn) => (btn.onclick = async () => { const r = await safely(() => sendCheer(p.id, btn.dataset.cheer), 'Cheer sent!'); if (r !== undefined) $$('[data-cheer]', root).forEach((x) => (x.disabled = true)); }));
  const rm = $('#rm', root);
  if (rm) rm.onclick = async () => { if (await confirmSheet({ title: 'Remove friend?', body: `<p class="muted">${esc(p.character_name)} will be removed from your friends.</p>`, ok: 'Remove', danger: true })) { await safely(() => removeFriend(fr.id)); location.hash = '#/friends'; } };
}
