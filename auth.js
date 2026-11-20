// Login + 3-step registration (account -> character -> companion).
import { signIn, signUp, usernameAvailable, currentUser, DEMO } from '../api.js';
import { avatarHTML, petHTML, bringPetsToLife, bringAvatarsToLife, STARTER_PETS, PETS, LOOKS } from '../sprites.js';
import { icon } from '../icons.js';
import { esc, $, $$ } from '../util.js';

export async function render(root, { onDone }) {
  const st = { mode: 'login', step: 1, username: '', email: '', password: '', name: '', gender: 'male', look: 0, pet: 'pet_gloop', err: '', busy: false, info: '' };
  const invite = localStorage.getItem('lq_invite');

  function view() {
    root.innerHTML = `${DEMO ? '<div class="demo-banner">DEMO MODE — local only</div>' : ''}<div class="auth">
      <div class="logo"><h1>LIFEQUEST</h1><p>Turn real life into an RPG</p></div>
      ${invite ? `<div class="card glow center small">${icon('users', 16)} You were invited by a friend (code <b>${esc(invite)}</b>). Sign up or log in to team up!</div>` : ''}
      <div class="card stack" id="box">${st.mode === 'login' ? loginHTML() : registerHTML()}</div>
      <p class="center muted small">${st.mode === 'login' ? 'New here?' : 'Already a hero?'}
        <a href="#" id="swap" style="color:var(--a1);font-weight:700">${st.mode === 'login' ? 'Create your character' : 'Log in'}</a></p></div>`;
    bind();
    bringPetsToLife(root); bringAvatarsToLife(root);
  }

  const err = () => (st.err ? `<div class="err" role="alert">${esc(st.err)}</div>` : '') + (st.info ? `<div class="card glow small">${esc(st.info)}</div>` : '');

  function loginHTML() {
    return `<h2>Welcome back</h2>${err()}
      <div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" value="${esc(st.email)}"></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" value=""></div>
      <button class="btn primary block" id="go" ${st.busy ? 'disabled' : ''}>${st.busy ? 'Logging in…' : 'Enter the realm'}</button>`;
  }

  function registerHTML() {
    const steps = `<div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= st.step ? 'on' : ''}"></i>`).join('')}</div>`;
    if (st.step === 1) return `${steps}<h2>Your account</h2>${err()}
      <div class="field"><label for="un">Username</label><input id="un" maxlength="20" autocomplete="username" placeholder="letters, numbers, _" value="${esc(st.username)}"></div>
      <div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="email" value="${esc(st.email)}"></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="new-password" placeholder="min. 8 characters" value="${esc(st.password)}"></div>
      <button class="btn primary block" id="next" ${st.busy ? 'disabled' : ''}>Next: create character</button>`;
    if (st.step === 2) return `${steps}<h2>Create your hero</h2>${err()}
      <div class="field"><label for="cn">Character name</label><input id="cn" maxlength="24" value="${esc(st.name || st.username)}"></div>
      <div class="field"><span class="lbl">Gender</span><div class="gender">${['male', 'female'].map((g) => `<button data-g="${g}" class="${st.gender === g ? 'on' : ''}">${avatarHTML({ gender: g, appearance: st.look, size: 84, blink: false })}${g === 'male' ? 'Male' : 'Female'}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Appearance</span><div class="looks">${LOOKS.map((_, i) => `<button class="look ${st.look === i ? 'on' : ''}" data-look="${i}" aria-label="Look ${i + 1}">${avatarHTML({ gender: st.gender, appearance: i, size: 70, blink: false })}</button>`).join('')}</div></div>
      <div class="row"><button class="btn" id="back">Back</button><button class="btn primary grow" id="next">Next: choose companion</button></div>`;
    return `${steps}<h2>Choose your companion</h2>${err()}<p class="muted small" style="margin:0">Tap a creature to see how it reacts. More companions can be unlocked later.</p>
      <div class="row" style="align-items:stretch">${STARTER_PETS.map((p) => `<div class="pick ${st.pet === p ? 'on' : ''}" data-pet="${p}">${petHTML(p, { size: 78 })}<b>${PETS[p].name}</b><small>${PETS[p].personality}</small></div>`).join('')}</div>
      <div class="row"><button class="btn" id="back">Back</button><button class="btn primary grow" id="go" ${st.busy ? 'disabled' : ''}>${st.busy ? 'Creating…' : 'Begin adventure'}</button></div>`;
  }

  function bind() {
    $('#swap', root).onclick = (e) => { e.preventDefault(); Object.assign(st, { mode: st.mode === 'login' ? 'register' : 'login', step: 1, err: '', info: '' }); view(); };
    const keep = () => {
      if ($('#email', root)) st.email = $('#email', root).value.trim();
      if ($('#un', root)) st.username = $('#un', root).value.trim();
      if ($('#pw', root) && st.mode === 'register') st.password = $('#pw', root).value;
      if ($('#cn', root)) st.name = $('#cn', root).value.trim();
    };
    $$('[data-g]', root).forEach((b) => (b.onclick = () => { keep(); st.gender = b.dataset.g; view(); }));
    $$('[data-look]', root).forEach((b) => (b.onclick = () => { keep(); st.look = +b.dataset.look; view(); }));
    $$('[data-pet]', root).forEach((b) => (b.onclick = () => { st.pet = b.dataset.pet; $$('.pick', root).forEach((p) => p.classList.toggle('on', p.dataset.pet === st.pet)); }));
    const back = $('#back', root); if (back) back.onclick = () => { keep(); st.step--; st.err = ''; view(); };
    root.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') ($('#go', root) || $('#next', root))?.click(); }));

    if (st.mode === 'login') {
      $('#go', root).onclick = async () => {
        keep(); st.password = $('#pw', root).value;
        if (!st.email || !st.password) { st.err = 'Enter your email and password.'; return view(); }
        st.busy = true; st.err = ''; view();
        try { await signIn(st.email, st.password); await currentUser(); st.password = ''; await onDone(); }
        catch (e) { st.busy = false; st.err = e.message === 'Invalid login credentials' ? 'Wrong email or password.' : e.message; view(); }
      };
      return;
    }
    const next = $('#next', root);
    if (next) next.onclick = async () => {
      keep();
      if (st.step === 1) {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(st.username)) { st.err = 'Username: 3–20 letters, numbers or underscores.'; return view(); }
        if (!/^\S+@\S+\.\S+$/.test(st.email)) { st.err = 'Enter a valid email address.'; return view(); }
        if (st.password.length < 8) { st.err = 'Password must be at least 8 characters.'; return view(); }
        st.busy = true; st.err = ''; view();
        try {
          if (!(await usernameAvailable(st.username))) { st.busy = false; st.err = 'That username is taken.'; return view(); }
        } catch (e) { st.busy = false; st.err = e.message; return view(); }
        st.busy = false;
      } else if (st.name.length < 2) { st.err = 'Give your character a name (2+ characters).'; return view(); }
      st.err = ''; st.step++; view();
    };
    const go = $('#go', root);
    if (go) go.onclick = async () => {
      st.busy = true; st.err = ''; view();
      try {
        const data = await signUp({ email: st.email, password: st.password, username: st.username, character_name: st.name || st.username, gender: st.gender, appearance: st.look, companion: st.pet, invite_code: localStorage.getItem('lq_invite') || '' });
        if (data?.session) { localStorage.removeItem('lq_invite'); await currentUser(); await onDone(); }
        else { Object.assign(st, { mode: 'login', busy: false, password: '', info: 'Account created! Check your email to confirm it, then log in.' }); view(); }
      } catch (e) { st.busy = false; st.err = /already registered/i.test(e.message) ? 'That email is already registered — try logging in.' : e.message; view(); }
    };
  }
  view();
}
