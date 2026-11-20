// Friends: list, requests, search by username, invite code/link, cheers received.
import { S, loadFriendships, searchUsers, sendFriendRequest, respondRequest, removeFriend, addByCode, loadCheers, inviteLink } from '../api.js';
import { safely } from '../actions.js';
import { avatarHTML, bringAvatarsToLife } from '../sprites.js';
import { icon } from '../icons.js';
import { openSheet, esc, $, $$, loadingHTML, errorHTML, emptyHTML, toast, timeAgo, confirmSheet } from '../util.js';
import { refreshBadges } from '../main.js';

export const miniAv = (p, size = 72) => `<div class="f-av">${avatarHTML({ gender: p?.gender, appearance: p?.appearance, size, blink: false })}</div>`;

export async function render(root) {
  let tab = 'friends', data, cheers = [];
  root.innerHTML = loadingHTML(4);
  const load = async () => {
    try { [data, cheers] = await Promise.all([loadFriendships(), loadCheers()]); } catch (e) { root.innerHTML = errorHTML(e.message); root.querySelector('[data-retry]').onclick = load; return; }
    draw(); refreshBadges();
  };
  function row(r, right = '') {
    const p = r.other; if (!p) return '';
    return `<div class="friend" data-open="${p.id}">${miniAv(p)}<div class="grow"><b>${esc(p.character_name)}</b><div class="small muted">@${esc(p.username)}</div></div><span class="chip xp">Lv ${p.level}</span>${right}</div>`;
  }
  function draw() {
    const inc = data.incoming.length;
    root.innerHTML = `<div class="page-title"><h2>Friends</h2><button class="btn sm primary" id="invite">${icon('share', 15)} Invite</button></div>
      <div class="seg" style="margin-bottom:12px"><button data-t="friends" class="${tab === 'friends' ? 'on' : ''}">Friends (${data.friends.length})</button><button data-t="requests" class="${tab === 'requests' ? 'on' : ''}">Requests${inc ? `<span class="dot">${inc}</span>` : ''}</button><button data-t="find" class="${tab === 'find' ? 'on' : ''}">Find</button></div><div id="tab"></div>`;
    $$('[data-t]', root).forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); load(); }));
    $('#invite', root).onclick = inviteSheet;
    const box = $('#tab', root);
    if (tab === 'friends') {
      box.innerHTML = (data.friends.length ? [...data.friends].sort((a, b) => (b.other?.total_xp || 0) - (a.other?.total_xp || 0)).map((r) => row(r)).join('') : emptyHTML('users', 'No friends yet. Search by username or share your invite code!'))
        + (cheers.length ? `<div class="section-h"><h2>${icon('flame', 18)} Cheers for you</h2></div><div class="card">${cheers.slice(0, 5).map((c) => `<div class="hist"><span>${{ fire: '🔥', muscle: '💪', star: '⭐', clap: '👏' }[c.kind] || '⭐'}</span><div class="grow small"><b>${esc(c.from?.character_name || 'A friend')}</b> cheered you</div><span class="small muted">${timeAgo(c.created_at)}</span></div>`).join('')}</div>` : '');
    } else if (tab === 'requests') {
      box.innerHTML = `<h3 class="muted small" style="text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Incoming</h3>${data.incoming.length ? data.incoming.map((r) => row(r, `<button class="btn sm good" data-acc="${r.id}" aria-label="Accept">${icon('check', 16)}</button><button class="btn sm danger" data-rej="${r.id}" aria-label="Reject">${icon('x', 16)}</button>`)).join('') : '<div class="muted small">No incoming requests.</div>'}
        <h3 class="muted small" style="text-transform:uppercase;letter-spacing:.07em;margin:16px 0 8px">Sent</h3>${data.outgoing.length ? data.outgoing.map((r) => row(r, '<span class="pill pending_review">Pending</span>')).join('') : '<div class="muted small">No pending sent requests.</div>'}`;
    } else {
      box.innerHTML = `<div class="field"><label for="q">Search by username</label><div class="row"><input id="q" placeholder="username" autocomplete="off"><button class="btn primary" id="sq">${icon('search', 18)}</button></div></div><div id="res" style="margin-top:12px"></div>
        <div class="card stack" style="margin-top:16px"><b>Have an invite code?</b><div class="row"><input id="code" maxlength="8" placeholder="CODE" style="text-transform:uppercase"><button class="btn primary" id="addc">Add</button></div></div>`;
      const go = async () => {
        const res = $('#res', root); res.innerHTML = loadingHTML(1);
        try {
          const list = await searchUsers($('#q', root).value);
          const known = new Set([...data.friends, ...data.incoming, ...data.outgoing].map((r) => r.other?.id));
          res.innerHTML = list.length ? list.map((p) => `<div class="friend" style="cursor:default">${miniAv(p)}<div class="grow"><b>${esc(p.character_name)}</b><div class="small muted">@${esc(p.username)} · Lv ${p.level}</div></div>${known.has(p.id) ? '<span class="pill completed">Added</span>' : `<button class="btn sm primary" data-add="${esc(p.username)}">${icon('plus', 14)} Add</button>`}</div>`).join('') : '<div class="muted small center">No players found (type at least 2 letters).</div>';
          bringAvatarsToLife(res);
        } catch (e) { res.innerHTML = errorHTML(e.message, false); }
      };
      $('#sq', root).onclick = go; $('#q', root).onkeydown = (e) => e.key === 'Enter' && go();
      $('#addc', root).onclick = async () => { const w = await safely(() => addByCode($('#code', root).value)); if (w) { toast(`Now friends with ${w}!`, 'good'); await load(); } };
    }
    bringAvatarsToLife(root);
  }
  function inviteSheet() {
    const url = inviteLink(), text = `Join me on LifeQuest! Use code ${S.me.invite_code}: ${url}`;
    {
      const sh = openSheet(`<h2>Invite friends</h2><p class="muted small">Friends who sign up through your link are added automatically.</p>
        <div class="card center" style="margin:12px 0"><div class="lbl">Your code</div><div class="display" style="font-size:34px;letter-spacing:.2em;color:var(--a1)">${esc(S.me.invite_code)}</div></div>
        <input readonly value="${esc(url)}" onfocus="this.select()"><div class="row" style="margin-top:12px"><button class="btn grow" id="cp">${icon('copy', 16)} Copy link</button><button class="btn primary grow" id="sh">${icon('share', 16)} Share</button></div>`);
      $('#cp', sh.el).onclick = async () => { try { await navigator.clipboard.writeText(text); toast('Copied!', 'good'); } catch { toast('Copy failed — select the link manually', 'bad'); } };
      $('#sh', sh.el).onclick = async () => { try { if (navigator.share) await navigator.share({ title: 'LifeQuest', text, url }); else { await navigator.clipboard.writeText(text); toast('Copied!', 'good'); } } catch { /* cancelled */ } };
    }
  }
  root.addEventListener('click', async (e) => {
    const acc = e.target.closest('[data-acc]'), rej = e.target.closest('[data-rej]'), add = e.target.closest('[data-add]'), open = e.target.closest('[data-open]');
    if (acc || rej) { e.stopPropagation(); await safely(() => respondRequest((acc || rej).dataset[acc ? 'acc' : 'rej'], !!acc), acc ? 'Friend added!' : 'Request declined'); await load(); }
    else if (add) { add.disabled = true; const r = await safely(() => sendFriendRequest(add.dataset.add)); if (r) { toast(r === 'accepted' ? 'You are now friends!' : 'Request sent!', 'good'); await load(); tab = 'find'; draw(); } else add.disabled = false; }
    else if (open) location.hash = `#/friend/${open.dataset.open}`;
  });
  await load();
}
