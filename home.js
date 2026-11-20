// Home: the game screen — character on stage, companion, today's quests, quick links.
import { S, loadQuests, equippedCosmetics, perkText } from '../api.js';
import { avatarHTML, petHTML, bringPetsToLife, bringAvatarsToLife, PETS } from '../sprites.js';
import { sceneHTML, sceneFor } from '../themes.js';
import { icon } from '../icons.js';
import { esc, fmt, loadingHTML, errorHTML } from '../util.js';
import { allOfKind, questCard, bindQuestActions } from '../questui.js';

export async function render(root) {
  root.innerHTML = loadingHTML(4);
  const draw = async () => {
    try { await loadQuests(); } catch (e) { root.innerHTML = errorHTML(e.message); root.querySelector('[data-retry]').onclick = draw; return; }
    const me = S.me, pet = PETS[me.active_companion] || PETS.pet_gloop;
    const daily = allOfKind('daily'), weekly = allOfKind('weekly'), special = allOfKind('special').filter((q) => q.status !== 'completed');
    const done = daily.filter((q) => q.status === 'completed').length;
    const sec = (title, ic, list, kind, total) => `<div class="section-h"><h2>${icon(ic, 18)} ${title}</h2><a class="small" style="color:var(--a1)" href="#/quests/${kind}">${total ?? ''} See all</a></div>
      ${list.length ? list.slice(0, 3).map(questCard).join('') : '<div class="card muted center small">All done here — nice work!</div>'}`;
    root.innerHTML = `<div class="stage"><div class="tag"><span class="chip">${icon('paw', 12)} ${esc(pet.name)}</span><span class="chip xp">${icon('bolt', 12)} ${esc(perkText(me.active_companion))}</span></div>
        ${sceneHTML(sceneFor(me.theme, me.background))}<div class="shade"></div>
        <div class="chars">${avatarHTML({ gender: me.gender, appearance: me.appearance, equipped: equippedCosmetics(), size: 104 })}${petHTML(me.active_companion, { size: 84, active: true })}</div></div>
      <p class="center muted small" style="margin:8px 0 0">Tap your companion!</p>
      <div class="grid2" style="margin-top:12px"><a href="#/quests" class="card row" style="text-decoration:none;color:inherit">${icon('target', 24)}<div><b>${done}/${daily.length}</b><div class="small muted">daily quests</div></div></a>
        <a href="#/shop" class="card row" style="text-decoration:none;color:inherit">${icon('coin', 24)}<div><b>${fmt(me.coins)}</b><div class="small muted">Coins to spend</div></div></a></div>
      ${sec('Daily', 'clock', daily.sort((a, b) => (a.status === 'completed') - (b.status === 'completed')), 'daily', `${done}/${daily.length}`)}
      ${sec('Weekly', 'shield', weekly, 'weekly')}${sec('Special', 'skull', special, 'special')}
      <div class="grid2" style="margin-top:18px"><a class="btn" href="#/stats">${icon('chart', 18)} Stats</a><a class="btn" href="#/friends">${icon('users', 18)} Friends</a></div>`;
    bringPetsToLife(root); bringAvatarsToLife(root);
  };
  bindQuestActions(root, draw);
  await draw();
}
