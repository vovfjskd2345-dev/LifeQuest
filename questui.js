// Shared quest UI: cards, actions (start / complete / submit evidence), custom quest creator.
import { S, DEMO, bonusFor, startQuest, completeQuest, submitQuest, createCustomQuest, deleteCustomQuest, loadQuests, evidenceUrl, demoApprove } from './api.js';
import { withReward, safely } from './actions.js';
import { icon, TOPIC_ICON } from './icons.js';
import { esc, $, $$, openSheet, confirmSheet, toast, timeLeft, dateKey, weekStartKey } from './util.js';

export const KINDS = { daily: 'Daily', weekly: 'Weekly', special: 'Special' };
export const TOPICS = ['Health', 'Mind', 'Study', 'Work', 'Home', 'Social', 'Creative'];
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2, epic: 3 };
const STATE_LABEL = { available: 'Available', in_progress: 'In progress', pending_review: 'Pending review', completed: 'Completed', expired: 'Expired' };

/** Mirrors SQL reward_for() — used only to PREVIEW rewards; the server decides the real amount. */
export function rewardFor(kind, diff, custom) {
  const bx = { easy: 10, medium: 25, hard: 50, epic: 100 }[diff], bc = { easy: 5, medium: 12, hard: 25, epic: 50 }[diff];
  const m = { daily: 1, weekly: 2, special: 3 }[kind] * (custom ? 0.5 : 1);
  return { xp: Math.max(1, Math.floor(bx * m)), coins: Math.max(1, Math.floor(bc * m)) };
}

export function qState(q) {
  if (q.status === 'completed') return 'completed';
  if (q.deadline && new Date(q.deadline) < new Date()) return 'expired';
  return q.status;
}

export function activeQuests(kind) {
  const today = dateKey(), wk = weekStartKey();
  return S.quests.filter((q) => {
    if (q.kind !== kind) return false;
    if (kind === 'daily') return q.period_date === today;
    if (kind === 'weekly') return q.period_date === wk;
    return q.status === 'completed' ? false : qState(q) !== 'expired';
  }).sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
}
export function allOfKind(kind) {
  const today = dateKey(), wk = weekStartKey();
  return S.quests.filter((q) => q.kind === kind && (kind === 'special' ? (q.is_custom ? qState(q) !== 'expired' || q.status === 'completed' : q.period_date === wk) : kind === 'daily' ? q.period_date === today : q.period_date === wk))
    .sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
}

export function questCard(q) {
  const st = qState(q);
  const bn = st === 'completed' ? { xp: 0, coins: 0 } : bonusFor(S.me?.active_companion, q);
  const proofBtn = `<button class="btn sm primary" data-act="submit" data-id="${q.id}">${icon('camera', 15)} Submit evidence</button>`;
  let acts = '';
  if (st === 'available') acts = `<button class="btn sm" data-act="start" data-id="${q.id}">Start</button>` + (q.requires_proof ? proofBtn : `<button class="btn sm good" data-act="complete" data-id="${q.id}">${icon('check', 15)} Complete</button>`);
  else if (st === 'in_progress') acts = q.requires_proof ? proofBtn : `<button class="btn sm good" data-act="complete" data-id="${q.id}">${icon('check', 15)} Complete</button>`;
  else if (st === 'pending_review') acts = `<span class="small muted">${icon('hourglass', 14)} Waiting for a friend to approve</span>` + (DEMO ? `<button class="btn sm alt" data-act="demoapprove" data-id="${q.id}">${icon('spark', 14)} Demo: bot friend approves</button>` : '');
  if (q.is_custom && q.status !== 'completed') acts += `<button class="btn sm danger" data-act="delete" data-id="${q.id}" aria-label="Delete quest">${icon('trash', 14)}</button>`;
  return `<article class="quest ${st === 'completed' ? 'done' : ''} ${st === 'pending_review' ? 'pending' : ''}" data-id="${q.id}">
    <div class="qicon">${icon(TOPIC_ICON[q.topic] || 'star', 22)}</div>
    <div class="grow"><div class="row between" style="align-items:flex-start"><span class="qname">${esc(q.name)}</span><span class="pill ${st}">${STATE_LABEL[st]}</span></div>
      ${q.description ? `<div class="qdesc">${esc(q.description)}</div>` : ''}
      <div class="qmeta"><span class="chip ${q.difficulty}">${q.difficulty}</span><span class="chip xp">${icon('bolt', 12)} ${q.xp_reward} XP${bn.xp ? ` <span class="bonus">+${bn.xp}</span>` : ''}</span><span class="chip coin">${icon('coin', 12)} ${q.coin_reward}${bn.coins ? ` <span class="bonus">+${bn.coins}</span>` : ''}</span>
        <span class="small muted">${esc(q.topic)}${q.is_custom ? ' · custom' : ''}</span>
        ${q.requires_proof ? `<span class="proof-tag">${icon('camera', 12)} proof</span>` : ''}
        ${q.deadline && st !== 'completed' ? `<span class="small ${st === 'expired' ? '' : 'muted'}" style="${st === 'expired' ? 'color:var(--bad)' : ''}">${icon('clock', 12)} ${timeLeft(q.deadline)}</span>` : ''}</div>
      ${q.review_note && q.status === 'in_progress' ? `<div class="review-note">Friend feedback: ${esc(q.review_note)}</div>` : ''}
      ${acts ? `<div class="qact">${acts}</div>` : ''}</div></article>`;
}

/** Delegated click handling for any element containing quest cards / data-act buttons. */
export function bindQuestActions(root, reload) {
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !root.contains(b)) return;
    const id = b.dataset.id;
    const q = S.quests.find((x) => x.id === id);
    if (!q) return;
    const act = b.dataset.act;
    if (act === 'start') { b.disabled = true; await safely(() => startQuest(id)); await reload(); }
    else if (act === 'complete') {
      const r = b.getBoundingClientRect(), from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      b.disabled = true;
      try { await withReward(() => completeQuest(id), { from }); } catch { /* toast shown */ }
      await reload();
    } else if (act === 'demoapprove') {
      const r = b.getBoundingClientRect(), from = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      b.disabled = true;
      try { await withReward(() => demoApprove(id), { from }); } catch { /* toast shown */ }
      await reload();
    } else if (act === 'submit') submitSheet(q, reload);
    else if (act === 'delete') {
      if (await confirmSheet({ title: 'Delete quest?', body: `<p class="muted">“${esc(q.name)}” will be removed.</p>`, ok: 'Delete', danger: true })) {
        await safely(() => deleteCustomQuest(id)); await reload();
      }
    }
  });
}

function submitSheet(q, reload) {
  let file = null;
  const s = openSheet(`<h2>Submit evidence</h2><p class="muted small">${esc(q.name)} — a friend must approve before you receive <b>${q.xp_reward} XP</b> and <b>${q.coin_reward} Coins</b>.</p>
    <div class="stack"><div class="field"><label for="ev-note">Short explanation</label><textarea id="ev-note" maxlength="500" placeholder="What did you do?"></textarea></div>
    <div class="field"><span class="lbl">Photo or file (optional, max 10 MB)</span>
      <label class="small muted" for="ev-cam">${icon('camera', 14)} Take a photo now</label>
      <input id="ev-cam" class="filein" type="file" accept="image/*" capture="environment">
      <label class="small muted" for="ev-file" style="margin-top:6px">${icon('upload', 14)} Or pick a photo / file from your phone</label>
      <input id="ev-file" class="filein" type="file" accept="image/*,application/pdf,text/plain">
      <div class="small muted" style="margin-top:6px">If nothing opens, open this page in your phone's browser (Chrome or Safari) instead of inside an app.</div>
      ${DEMO ? `<button class="btn alt" id="ev-sample" type="button">${icon('camera', 16)} Use a sample photo (demo)</button>` : ''}</div>
    <div id="ev-prev"></div><div class="err hide" id="ev-err"></div>
    <div class="row"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="ev-go">${icon('send', 16)} Send for review</button></div></div>`);
  const show = () => {
      $('#ev-prev', s.el).innerHTML = file ? `<div class="evidence">${file.type.startsWith('image/') ? `<img alt="preview" src="${URL.createObjectURL(file)}">` : icon('file', 28)}<span class="small grow">${esc(file.name)}</span><button class="btn sm danger" id="ev-x" aria-label="Remove file">${icon('x', 14)}</button></div>` : '';
      const x = $('#ev-x', s.el); if (x) x.onclick = () => { file = null; show(); };
  };
  const pick = (inp) => { inp.onchange = () => { file = inp.files[0] || null; show(); }; };
  const sample = $('#ev-sample', s.el);
  if (sample) sample.onclick = () => {
    const c = document.createElement('canvas'); c.width = 480; c.height = 300; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 480, 300); gr.addColorStop(0, '#35f0ff'); gr.addColorStop(1, '#8b5cf6'); g.fillStyle = gr; g.fillRect(0, 0, 480, 300);
    g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('Sample evidence', 240, 140); g.font = '20px sans-serif'; g.fillText(new Date().toLocaleString(), 240, 180);
    c.toBlob((bl) => { file = new File([bl], 'sample-evidence.png', { type: 'image/png' }); show(); }, 'image/png');
  };
  pick($('#ev-cam', s.el)); pick($('#ev-file', s.el));
  $('#ev-go', s.el).onclick = async () => {
    const note = $('#ev-note', s.el).value.trim(), go = $('#ev-go', s.el), err = $('#ev-err', s.el);
    if (note.length < 3 && !file) { err.textContent = 'Add a short explanation or a file.'; err.classList.remove('hide'); return; }
    go.disabled = true; go.textContent = 'Uploading…';
    try { await submitQuest(q.id, note, file); s.close(); toast('Sent! A friend can now review it.', 'good'); await reload(); }
    catch (ex) { err.textContent = ex.message; err.classList.remove('hide'); go.disabled = false; go.innerHTML = `${icon('send', 16)} Send for review`; }
  };
}

export function createSheet(reload, preset = {}) {
  const st = { kind: preset.kind || 'daily', diff: 'easy', proof: false };
  const s = openSheet(`<h2>New custom quest</h2><div class="stack" id="cq"></div>`);
  const box = $('#cq', s.el);
  const draw = () => {
    if (st.kind === 'special') st.proof = true;
    if (st.diff === 'epic' && st.kind !== 'special') st.diff = 'hard';
    const r = rewardFor(st.kind, st.diff, true);
    box.innerHTML = `<div class="field"><label for="cq-name">Name</label><input id="cq-name" maxlength="60" placeholder="e.g. Practice guitar" value="${esc(st.name || '')}"></div>
      <div class="field"><label for="cq-desc">Description</label><textarea id="cq-desc" maxlength="300" placeholder="What counts as done?">${esc(st.desc || '')}</textarea></div>
      <div class="field"><span class="lbl">Type</span><div class="seg">${Object.entries(KINDS).map(([k, l]) => `<button data-kind="${k}" class="${st.kind === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="cq-topic">Category</label><select id="cq-topic">${TOPICS.map((t) => `<option ${st.topic === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><span class="lbl">Difficulty</span><div class="seg">${['easy', 'medium', 'hard', 'epic'].filter((d) => d !== 'epic' || st.kind === 'special').map((d) => `<button data-diff="${d}" class="${st.diff === d ? 'on' : ''}">${d}</button>`).join('')}</div></div>
      <div class="card row between" style="padding:10px 12px"><span class="small muted">Reward (fixed by difficulty)</span><span class="row"><span class="chip xp">${icon('bolt', 12)} ${r.xp} XP</span><span class="chip coin">${icon('coin', 12)} ${r.coins}</span></span></div>
      <div class="row between"><div><b>Requires proof</b><div class="small muted">${st.kind === 'special' ? 'Always on for Special quests' : 'A friend must approve it'}</div></div><button class="switch ${st.proof ? 'on' : ''}" id="cq-proof" ${st.kind === 'special' ? 'disabled' : ''} aria-label="Requires proof"></button></div>
      ${st.kind === 'special' ? `<div class="field"><label for="cq-dl">Deadline (optional)</label><input id="cq-dl" type="datetime-local" value="${esc(st.deadline || '')}"></div>` : ''}
      <p class="small muted" style="margin:0">Custom quests give half rewards and are limited (5 per day, 3 Special per week) to keep progress fair.</p>
      <div class="err hide" id="cq-err"></div><div class="row"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="cq-go">Create quest</button></div>`;
    $$('[data-kind]', box).forEach((b) => (b.onclick = () => { keep(); st.kind = b.dataset.kind; draw(); }));
    $$('[data-diff]', box).forEach((b) => (b.onclick = () => { keep(); st.diff = b.dataset.diff; draw(); }));
    $('#cq-proof', box).onclick = () => { keep(); st.proof = !st.proof; draw(); };
    $('#cq-go', box).onclick = async () => {
      keep();
      const err = $('#cq-err', box), go = $('#cq-go', box);
      if ((st.name || '').trim().length < 3) { err.textContent = 'Give your quest a name (3+ characters).'; err.classList.remove('hide'); return; }
      go.disabled = true;
      try {
        await createCustomQuest({ name: st.name, desc: st.desc, kind: st.kind, topic: st.topic || 'Health', diff: st.diff, proof: st.proof, deadline: st.deadline ? new Date(st.deadline).toISOString() : null });
        s.close(); toast('Quest created!', 'good'); await reload(st.kind);
      } catch (ex) { err.textContent = ex.message; err.classList.remove('hide'); go.disabled = false; }
    };
  };
  const keep = () => {
    st.name = $('#cq-name', box)?.value; st.desc = $('#cq-desc', box)?.value; st.topic = $('#cq-topic', box)?.value; st.deadline = $('#cq-dl', box)?.value || st.deadline;
  };
  draw();
}

export async function reloadQuests() { await loadQuests(); }
export { evidenceUrl };
