// Quests page: Daily / Weekly / Special tabs, custom quests, and friend review inbox.
import { S, loadQuests, pendingReviews, reviewQuest, evidenceUrl } from '../api.js';
import { withReward, safely } from '../actions.js';
import { icon } from '../icons.js';
import { esc, $, $$, loadingHTML, errorHTML, emptyHTML, timeAgo, toast, openSheet } from '../util.js';
import { allOfKind, questCard, bindQuestActions, createSheet, KINDS } from '../questui.js';
import { refreshBadges } from '../main.js';

export async function render(root, { args }) {
  let tab = KINDS[args[0]] || args[0] === 'review' ? args[0] : 'daily';
  root.innerHTML = loadingHTML(4);
  let reviews = [];

  const draw = async (k) => {
    if (k) tab = k;
    try { await loadQuests(); reviews = await pendingReviews(); } catch (e) { root.innerHTML = errorHTML(e.message); root.querySelector('[data-retry]').onclick = () => draw(); return; }
    const list = tab === 'review' ? [] : allOfKind(tab);
    const done = list.filter((q) => q.status === 'completed').length;
    root.innerHTML = `<div class="page-title"><h2>Quest Log</h2><button class="btn sm primary" id="new">${icon('plus', 16)} Custom</button></div>
      <div class="seg" style="margin-bottom:12px">${Object.entries(KINDS).map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}
        <button data-tab="review" class="${tab === 'review' ? 'on' : ''}">Review${reviews.length ? `<span class="dot">${reviews.length}</span>` : ''}</button></div>
      ${tab === 'review' ? reviewHTML() : `<div class="card" style="margin-bottom:12px"><div class="row between small"><span class="muted">${tab === 'daily' ? 'Resets every day' : tab === 'weekly' ? 'Resets every Monday' : 'New challenges every Monday · bigger rewards'}</span><b>${done}/${list.length}</b></div>
        <div class="progress-mini"><i style="width:${list.length ? (done / list.length) * 100 : 0}%"></i></div></div>
        ${list.length ? list.map(questCard).join('') : emptyHTML('sword', 'No quests here yet. Create your own!')}`}`;
    $$('[data-tab]', root).forEach((b) => (b.onclick = () => draw(b.dataset.tab)));
    $('#new', root).onclick = () => createSheet((kind) => draw(kind), { kind: ['daily', 'weekly', 'special'].includes(tab) ? tab : 'daily' });
    refreshBadges();
  };

  function reviewHTML() {
    if (!reviews.length) return emptyHTML('eye', 'Nothing to review. When friends submit evidence it shows up here.');
    return `<p class="muted small">Friends asked you to verify their quests. Approving pays out their reward — be fair!</p>` + reviews.map((q) => `<article class="quest pending" data-rv="${q.id}"><div class="grow">
      <div class="qname">${esc(q.name)}</div><div class="qdesc">${esc(q.description)}</div>
      <div class="qmeta"><span class="chip ${q.difficulty}">${q.difficulty}</span><span class="small muted">${timeAgo(q.submitted_at)}</span></div>
      <div class="evidence">${q.evidence_path ? `<button class="btn sm" data-ev="${esc(q.evidence_path)}">${icon('eye', 14)} View file</button>` : ''}<span class="small">${esc(q.evidence_note || 'No written note')}</span></div>
      <div class="qact"><button class="btn sm good" data-ok="${q.id}">${icon('check', 15)} Approve</button><button class="btn sm danger" data-no="${q.id}">${icon('x', 15)} Reject</button></div></div></article>`).join('');
  }

  root.addEventListener('click', async (e) => {
    const ev = e.target.closest('[data-ev]'), ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
    if (ev) { try { const url = await evidenceUrl(ev.dataset.ev); openSheet(`<h2>Evidence</h2>${/\.(png|jpe?g|webp|gif)$/i.test(ev.dataset.ev) ? `<img src="${esc(url)}" alt="evidence" style="width:100%;border-radius:12px">` : `<a class="btn primary block" target="_blank" rel="noopener" href="${esc(url)}">Open file</a>`}`); } catch (x) { toast(x.message, 'bad'); } }
    if (ok) { ok.disabled = true; await safely(() => reviewQuest(ok.dataset.ok, true), 'Approved — your friend gets the reward!'); await draw(); }
    if (no) {
      const note = prompt('Why are you rejecting this? (optional)') ?? null;
      if (note === null) return;
      no.disabled = true; await safely(() => reviewQuest(no.dataset.no, false, note), 'Sent back to your friend.'); await draw();
    }
  });
  bindQuestActions(root, () => draw());
  await draw();
}
