// Stats: totals, activity charts, category progress, history, achievement progress.
import { S, completedQuests } from '../api.js';
import { icon, TOPIC_ICON } from '../icons.js';
import { esc, fmt, xpNeeded, dateKey, weekStartKey, loadingHTML, errorHTML, timeAgo } from '../util.js';
import { TOPICS } from '../questui.js';

export async function render(root) {
  root.innerHTML = loadingHTML(4);
  let done;
  try { done = await completedQuests(); } catch (e) { root.innerHTML = errorHTML(e.message); root.querySelector('[data-retry]').onclick = () => render(root); return; }
  const me = S.me;
  const mine = (d) => dateKey(new Date(d));
  const byDay = {}, byWeek = {}, byTopic = {};
  done.forEach((q) => {
    const k = mine(q.completed_at), w = weekStartKey(new Date(q.completed_at));
    byDay[k] = (byDay[k] || 0) + 1; byWeek[w] = (byWeek[w] || 0) + 1; byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
  });
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return { k: dateKey(d), l: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], n: 0 }; });
  days.forEach((d) => (d.n = byDay[d.k] || 0));
  const weeks = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 7 * (7 - i)); const k = weekStartKey(d); return { k, l: k.slice(5).replace('-', '/'), n: byWeek[k] || 0 }; });
  const bars = (arr) => { const max = Math.max(1, ...arr.map((x) => x.n)); return `<div class="bars">${arr.map((x, i) => `<div class="b" title="${x.n}"><small class="small muted" style="font-size:10px">${x.n || ''}</small><i class="${x.n ? '' : 'zero'}" style="height:${Math.max(3, (x.n / max) * 80)}px;animation-delay:${i * 40}ms"></i><span>${x.l}</span></div>`).join('')}</div>`; };
  const total = done.length, maxT = Math.max(1, ...Object.values(byTopic));
  const unl = S.unlocked.size;

  root.innerHTML = `<div class="page-title"><h2>Stats</h2><a class="btn sm" href="#/profile">${icon('user', 14)} Profile</a></div>
    <div class="statgrid"><div class="stat"><span>${icon('bolt', 14)} Total XP</span><b>${fmt(me.total_xp)}</b></div><div class="stat"><span>${icon('coin', 14)} Total Coins earned</span><b>${fmt(me.total_coins)}</b></div>
      <div class="stat"><span>${icon('star', 14)} Level</span><b>${me.level}</b></div><div class="stat"><span>${icon('check', 14)} Quests completed</span><b>${fmt(me.quests_completed)}</b></div>
      <div class="stat"><span>${icon('flame', 14)} Current streak</span><b>${me.streak}</b></div><div class="stat"><span>${icon('trophy', 14)} Best streak</span><b>${me.best_streak}</b></div></div>
    <div class="section-h"><h2>${icon('chart', 18)} Daily activity</h2><span class="small muted">last 14 days</span></div><div class="card">${bars(days)}</div>
    <div class="section-h"><h2>${icon('chart', 18)} Weekly activity</h2><span class="small muted">last 8 weeks</span></div><div class="card">${bars(weeks)}</div>
    <div class="section-h"><h2>${icon('target', 18)} Progress by category</h2></div>
    <div class="card stack" style="gap:10px">${TOPICS.map((t) => `<div><div class="row between small"><span class="row" style="gap:6px">${icon(TOPIC_ICON[t], 14)} ${t}</span><b>${byTopic[t] || 0}</b></div><div class="xpbar"><i style="width:${((byTopic[t] || 0) / maxT) * 100}%"></i></div></div>`).join('')}</div>
    <div class="section-h"><h2>${icon('trophy', 18)} Achievement progress</h2></div>
    <div class="card row"><div class="ring" style="--p:${S.ach.length ? Math.round((unl / S.ach.length) * 100) : 0}"><b>${unl}/${S.ach.length}</b></div>
      <div class="grow stack" style="gap:6px">${S.ach.filter((a) => !S.unlocked.has(a.id)).slice(0, 3).map((a) => { const v = { quests: me.quests_completed, level: me.level, streak: me.best_streak, coins: me.total_coins }[a.metric]; return v == null ? `<div class="small"><b>${esc(a.name)}</b> <span class="muted">${esc(a.description)}</span></div>` : `<div class="small"><div class="row between"><b>${esc(a.name)}</b><span class="muted">${Math.min(v, a.target)}/${a.target}</span></div><div class="progress-mini"><i style="width:${Math.min(100, (v / a.target) * 100)}%"></i></div></div>`; }).join('') || '<span class="muted small">All achievements unlocked!</span>'}</div></div>
    <div class="section-h"><h2>${icon('clock', 18)} Quest history</h2><span class="small muted">${total} total</span></div>
    <div class="card">${done.slice(0, 20).map((q) => `<div class="hist"><div class="qicon" style="width:34px;height:34px">${icon(TOPIC_ICON[q.topic] || 'star', 18)}</div><div class="grow"><div style="font-weight:600">${esc(q.name)}</div><div class="small muted">${timeAgo(q.completed_at)} · ${esc(q.topic)}</div></div><span class="chip xp">+${q.xp_reward}</span></div>`).join('') || '<div class="empty">Complete a quest to start your history.</div>'}</div>`;
}
