// DEMO MODE ONLY: a tiny in-browser stand-in for Supabase (same API surface the app uses),
// persisted in localStorage. It mirrors the SQL functions in supabase/schema.sql so the
// whole game can be tried without a backend. It also seeds a few bot players for social features.
import { SEED } from './seed.js';

const KEY = 'lq_demo_db_v1';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(16).slice(2) + Date.now());
const clone = (x) => JSON.parse(JSON.stringify(x));
const xpNeeded = (l) => 100 + 40 * (l - 1) + 10 * (l - 1) * (l - 1);
const MULT = { daily: 1, weekly: 2, special: 3 }, BX = { easy: 10, medium: 25, hard: 50, epic: 100 }, BC = { easy: 5, medium: 12, hard: 25, epic: 50 };
const reward = (k, d, custom) => ({ xp: Math.max(1, Math.floor(BX[d] * MULT[k] * (custom ? 0.5 : 1))), coins: Math.max(1, Math.floor(BC[d] * MULT[k] * (custom ? 0.5 : 1))) });
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dkey(new Date());
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); };
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); const x = new Date(y, m - 1, d + n); return dkey(x); };

let db;
function load() {
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  db = db || mem;
  if (!db) {
    db = { session: null, users: [], profiles: [], inventory: [], quests: [], user_achievements: [], friendships: [], cheers: [], files: {} };
    [['aria_blade', 'Aria Blade', 'female', 1, 'pet_ember', 7, 2400, 84, 12, 9], ['kai_rune', 'Kai Rune', 'male', 2, 'pet_nox', 4, 900, 31, 5, 3], ['mira_moon', 'Mira Moon', 'female', 5, 'pet_mochi', 2, 220, 9, 2, 1]]
      .forEach(([un, cn, g, ap, pet, lv, txp, qc, bs, st]) => {
        const id = uid();
        db.users.push({ id, email: un + '@demo.test', password: 'demo-pass' });
        db.profiles.push(newProfile(id, un, cn, g, ap, pet, { level: lv, xp: 40, total_xp: txp, total_coins: Math.floor(txp / 2), coins: 60, quests_completed: qc, best_streak: bs, streak: st, bio: 'Bot adventurer for the demo.' }));
        db.inventory.push({ user_id: id, item_id: pet, equipped: true, acquired_at: new Date().toISOString() }, { user_id: id, item_id: 'theme_neon', equipped: true }, { user_id: id, item_id: 'title_novice', equipped: true });
        ['a_first', 'a_10', 'a_lvl2'].slice(0, lv > 3 ? 3 : 2).forEach((a) => db.user_achievements.push({ user_id: id, achievement_id: a, unlocked_at: new Date().toISOString() }));
      });
  }
}
let mem = null;
function save() { mem = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* keep in memory only */ } }
function newProfile(id, username, character_name, gender, appearance, pet, extra = {}) {
  return { id, username, character_name, gender, appearance, bio: '', active_companion: pet, theme: 'theme_neon', background: null, title: 'title_novice', level: 1, xp: 0, coins: 0, total_xp: 0, total_coins: 0, quests_completed: 0, streak: 0, best_streak: 0, last_active: null, tz_offset_min: 0, invite_code: Math.random().toString(36).slice(2, 10).toUpperCase(), created_at: new Date().toISOString(), ...extra };
}

const tables = () => ({ ...db, pet_perks: SEED.pet_perks, shop_items: SEED.shop_items, quest_templates: SEED.quest_templates, achievements: SEED.achievements });
const me = () => { if (!db.session) throw new Error('Not signed in'); return db.profiles.find((p) => p.id === db.session); };
const prof = (id) => db.profiles.find((p) => p.id === id);
const isFriend = (a, b) => db.friendships.some((f) => f.status === 'accepted' && ((f.requester === a && f.addressee === b) || (f.requester === b && f.addressee === a)));
const shopItem = (id) => SEED.shop_items.find((i) => i.id === id);
const fail = (m) => { throw new Error(m); };

function checkAchievements(id) {
  const p = prof(id), got = [];
  for (const a of SEED.achievements) {
    if (db.user_achievements.some((u) => u.user_id === id && u.achievement_id === a.id)) continue;
    const v = { quests: p.quests_completed, level: p.level, streak: p.best_streak, coins: p.total_coins,
      special: db.quests.filter((q) => q.user_id === id && q.kind === 'special' && q.status === 'completed').length,
      companions: db.inventory.filter((i) => i.user_id === id && shopItem(i.item_id)?.category === 'companion').length,
      friends: db.friendships.filter((f) => f.status === 'accepted' && (f.requester === id || f.addressee === id)).length }[a.metric];
    if (v >= a.target) { db.user_achievements.push({ user_id: id, achievement_id: a.id, unlocked_at: new Date().toISOString() }); p.coins += a.reward_coins; p.total_coins += a.reward_coins; got.push({ id: a.id, name: a.name, icon: a.icon, reward_coins: a.reward_coins }); }
  }
  return got;
}

function finish(q, reviewer) {
  if (q.status === 'completed') fail('This quest was already completed');
  q.status = 'completed'; q.completed_at = new Date().toISOString(); q.reviewed_by = reviewer;
  const p = prof(q.user_id), before = p.level, t = today();
  const streak = p.last_active >= t ? Math.max(p.streak, 1) : p.last_active === addDays(t, -1) ? p.streak + 1 : 1;
  const perk = SEED.pet_perks.find((k) => k.item_id === p.active_companion);
  let bxp = 0, bcoins = 0;
  if (perk && (!perk.topics || perk.topics.split(',').includes(q.topic))) {
    if (perk.xp_pct > 0) bxp = Math.max(1, Math.round((q.xp_reward * perk.xp_pct) / 100));
    if (perk.coin_pct > 0) bcoins = Math.max(1, Math.round((q.coin_reward * perk.coin_pct) / 100));
  }
  const gxp = q.xp_reward + bxp, gcoins = q.coin_reward + bcoins;
  p.xp += gxp;
  while (p.xp >= xpNeeded(p.level)) { p.xp -= xpNeeded(p.level); p.level++; }
  Object.assign(p, { coins: p.coins + gcoins, total_xp: p.total_xp + gxp, total_coins: p.total_coins + gcoins, quests_completed: p.quests_completed + 1, streak, best_streak: Math.max(p.best_streak, streak), last_active: p.last_active && p.last_active > t ? p.last_active : t });
  const ach = checkAchievements(p.id);
  return { quest_id: q.id, xp: gxp, coins: gcoins, bonus_xp: bxp, bonus_coins: bcoins, level_before: before, level_after: p.level, leveled_up: p.level > before, achievements: ach };
}

const RPC = {
  username_available: ({ uname }) => !db.profiles.some((p) => p.username.toLowerCase() === uname.toLowerCase()),
  set_tz: () => null,
  my_profile: () => (db.session ? me() : null),
  ensure_period_quests: () => {
    const m = me(), t = today(), w = weekStart();
    const mk = (tpl, key, pd, deadline) => {
      if (db.quests.some((q) => q.user_id === m.id && q.template_id === tpl.id && q.period_key === key)) return;
      const r = reward(tpl.kind, tpl.difficulty, false);
      db.quests.push({ id: uid(), user_id: m.id, template_id: tpl.id, kind: tpl.kind, topic: tpl.topic, name: tpl.name, description: tpl.description, difficulty: tpl.difficulty, xp_reward: r.xp, coin_reward: r.coins, requires_proof: tpl.requires_proof, is_custom: false, deadline, period_key: key, period_date: pd, status: 'available', evidence_note: null, evidence_path: null, review_note: null, submitted_at: null, completed_at: null, created_at: new Date().toISOString() });
    };
    for (const tpl of SEED.quest_templates) {
      if (tpl.kind === 'daily') mk(tpl, t, t, null);
      else if (tpl.kind === 'weekly') mk(tpl, w, w, null);
    }
    // specials rotate weekly: 3 per week, picked once, expiring at local Monday 00:00
    if (!db.quests.some((q) => q.user_id === m.id && q.kind === 'special' && !q.is_custom && q.period_key === w)) {
      const h = (s) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 1000003; return x; };
      const [y, mo, d] = w.split('-').map(Number), end = new Date(y, mo - 1, d + 7).toISOString();
      const lw = (() => { const [yy, mm, dd] = w.split('-').map(Number); return dkey(new Date(yy, mm - 1, dd - 7)); })();
      const lastWeek = new Set(db.quests.filter((q) => q.user_id === m.id && q.kind === 'special' && !q.is_custom && q.period_key === lw).map((q) => q.template_id));
      SEED.quest_templates.filter((x) => x.kind === 'special' && !lastWeek.has(x.id)).sort((a, b) => h(w + m.id + a.id) - h(w + m.id + b.id)).slice(0, 3).forEach((tpl) => mk(tpl, w, w, end));
    }
  },
  create_custom_quest: (a) => {
    const m = me();
    if (!['daily', 'weekly', 'special'].includes(a.p_kind)) fail('Invalid quest type');
    if (a.p_diff === 'epic' && a.p_kind !== 'special') fail('Epic difficulty is only for Special quests');
    if ((a.p_name || '').trim().length < 3) fail('Name must be at least 3 characters');
    if (a.p_deadline && new Date(a.p_deadline) <= new Date()) fail('Deadline must be in the future (max 1 year)');
    const mine = db.quests.filter((q) => q.user_id === m.id && q.is_custom);
    if (a.p_kind === 'special' ? mine.filter((q) => q.kind === 'special' && Date.now() - new Date(q.created_at) < 7 * 864e5).length >= 3 : mine.filter((q) => q.kind !== 'special' && Date.now() - new Date(q.created_at) < 864e5).length >= 5)
      fail(a.p_kind === 'special' ? 'Limit reached: 3 custom Special quests per week' : 'Limit reached: 5 custom quests per day');
    const r = reward(a.p_kind, a.p_diff, true), id = uid();
    db.quests.push({ id, user_id: m.id, template_id: null, kind: a.p_kind, topic: a.p_topic, name: a.p_name.trim(), description: (a.p_desc || '').slice(0, 300), difficulty: a.p_diff, xp_reward: r.xp, coin_reward: r.coins, requires_proof: a.p_kind === 'special' ? true : !!a.p_proof, is_custom: true, deadline: a.p_kind === 'special' ? a.p_deadline : null, period_key: 'c-' + id, period_date: a.p_kind === 'daily' ? today() : a.p_kind === 'weekly' ? weekStart() : null, status: 'available', created_at: new Date().toISOString() });
    return id;
  },
  delete_custom_quest: ({ qid }) => { db.quests = db.quests.filter((q) => !(q.id === qid && q.user_id === me().id && q.is_custom && q.status !== 'completed')); return null; },
  start_quest: ({ qid }) => { const q = db.quests.find((x) => x.id === qid && x.user_id === me().id); if (q?.status === 'available') q.status = 'in_progress'; return null; },
  complete_quest: ({ qid }) => {
    const q = db.quests.find((x) => x.id === qid && x.user_id === me().id); if (!q) fail('Quest not found');
    if (q.requires_proof) fail('This quest needs evidence — submit it for review');
    if (q.deadline && new Date(q.deadline) < new Date()) fail('This quest has expired');
    return finish(q, null);
  },
  submit_quest: ({ qid, note, path }) => {
    const q = db.quests.find((x) => x.id === qid && x.user_id === me().id); if (!q) fail('Quest not found');
    if (!q.requires_proof) fail('This quest does not need review');
    if (!['available', 'in_progress'].includes(q.status)) fail('Quest cannot be submitted right now');
    if (!(note || '').trim() && !path) fail('Add a short explanation or a file as evidence');
    Object.assign(q, { status: 'pending_review', evidence_note: (note || '').trim().slice(0, 500), evidence_path: path, submitted_at: new Date().toISOString(), review_note: null });
    // demo convenience: a bot friend reviews it a moment later if you have no real second user
    return null;
  },
  review_quest: ({ qid, approve, note }) => {
    const m = me(), q = db.quests.find((x) => x.id === qid);
    if (!q || q.status !== 'pending_review') fail('Nothing to review');
    if (q.user_id === m.id) fail('You cannot review your own quest');
    if (!isFriend(m.id, q.user_id)) fail('Only friends can review this quest');
    if (approve) return finish(q, m.id);
    Object.assign(q, { status: 'in_progress', review_note: note || 'Rejected' }); return { rejected: true };
  },
  demo_approve: ({ qid }) => { // demo only: a bot friend approves your evidence
    const m = me(), q = db.quests.find((x) => x.id === qid && x.user_id === m.id && x.status === 'pending_review');
    if (!q) fail('Nothing to approve');
    return finish(q, db.profiles.find((p) => p.id !== m.id)?.id || null);
  },
  purchase_item: ({ iid }) => {
    const m = me(), it = shopItem(iid); if (!it) fail('Item not found');
    if (db.inventory.some((i) => i.user_id === m.id && i.item_id === iid)) fail('You already own this item');
    if (m.level < it.min_level) fail('Requires level ' + it.min_level);
    if (m.coins < it.price) fail('Not enough Coins');
    m.coins -= it.price; db.inventory.push({ user_id: m.id, item_id: iid, equipped: false, acquired_at: new Date().toISOString() });
    return { item: iid, coins_after: m.coins, achievements: checkAchievements(m.id) };
  },
  equip_item: ({ iid, on_off }) => {
    const m = me(), it = shopItem(iid), inv = (id) => db.inventory.find((i) => i.user_id === m.id && i.item_id === id);
    if (!it || !inv(iid)) fail('You do not own this item');
    const same = (fn) => db.inventory.filter((i) => i.user_id === m.id && fn(shopItem(i.item_id)));
    if (it.category === 'companion') { if (!on_off) fail('Choose another companion to switch'); same((s) => s.category === 'companion').forEach((i) => (i.equipped = i.item_id === iid)); m.active_companion = iid; }
    else if (['theme', 'title', 'background'].includes(it.category)) {
      same((s) => s.category === it.category).forEach((i) => (i.equipped = false));
      const dflt = it.category === 'theme' ? 'theme_neon' : it.category === 'title' ? 'title_novice' : null;
      const target = on_off ? iid : dflt; if (target) inv(target).equipped = true;
      m[it.category === 'theme' ? 'theme' : it.category === 'title' ? 'title' : 'background'] = target;
    } else {
      const slot = it.data?.slot;
      if (on_off && slot) same((s) => s.category === it.category && s.data?.slot === slot).forEach((i) => (i.equipped = false));
      inv(iid).equipped = !!on_off;
    }
    return null;
  },
  update_profile: ({ p_char, p_appearance, p_bio }) => { if ((p_char || '').trim().length < 2) fail('Character name too short'); Object.assign(me(), { character_name: p_char.trim().slice(0, 24), appearance: p_appearance, bio: (p_bio || '').slice(0, 160) }); return null; },
  send_friend_request: ({ uname }) => {
    const m = me(), t = db.profiles.find((p) => p.username.toLowerCase() === uname.trim().toLowerCase());
    if (!t) fail('No player with that username'); if (t.id === m.id) fail('You cannot add yourself');
    const f = db.friendships.find((x) => (x.requester === m.id && x.addressee === t.id) || (x.requester === t.id && x.addressee === m.id));
    if (f) { if (f.status === 'accepted') fail('Already friends'); if (f.requester === m.id) fail('Request already sent'); f.status = 'accepted'; checkAchievements(m.id); return 'accepted'; }
    db.friendships.push({ id: uid(), requester: m.id, addressee: t.id, status: 'pending', created_at: new Date().toISOString() });
    // demo bots accept after a short while so the flow can be seen
    if (t.bio.startsWith('Bot')) setTimeout(() => { const fr = db.friendships.find((x) => x.requester === m.id && x.addressee === t.id); if (fr) { fr.status = 'accepted'; checkAchievements(m.id); save(); } }, 2500);
    return 'sent';
  },
  respond_friend_request: ({ fid, accept }) => { const f = db.friendships.find((x) => x.id === fid && x.addressee === me().id && x.status === 'pending'); if (!f) fail('Request not found'); if (accept) { f.status = 'accepted'; checkAchievements(f.requester); checkAchievements(f.addressee); } else db.friendships = db.friendships.filter((x) => x !== f); return null; },
  remove_friend: ({ fid }) => { db.friendships = db.friendships.filter((f) => !(f.id === fid && (f.requester === me().id || f.addressee === me().id))); return null; },
  add_friend_by_code: ({ code }) => {
    const m = me(), t = db.profiles.find((p) => p.invite_code === code.trim().toUpperCase());
    if (!t) fail('Invalid invite code'); if (t.id === m.id) fail('That is your own code');
    const f = db.friendships.find((x) => (x.requester === m.id && x.addressee === t.id) || (x.requester === t.id && x.addressee === m.id));
    if (f) f.status = 'accepted'; else db.friendships.push({ id: uid(), requester: t.id, addressee: m.id, status: 'accepted', created_at: new Date().toISOString() });
    checkAchievements(m.id); return t.username;
  },
  send_cheer: ({ to_user, k }) => {
    const m = me(); if (!isFriend(m.id, to_user)) fail('You can only cheer friends');
    const d = new Date().toISOString().slice(0, 10);
    if (db.cheers.some((c) => c.from_id === m.id && c.to_id === to_user && c.cheer_date === d)) fail('You already cheered this friend today');
    db.cheers.push({ id: uid(), from_id: m.id, to_id: to_user, kind: k, cheer_date: d, created_at: new Date().toISOString() }); return null;
  },
};

// ---------- query builder ---------------------------------------------------

function visible(table, row) { // mimic RLS read policies
  const id = db.session; if (!id) return false;
  if (table === 'quests') return row.user_id === id || (row.status === 'pending_review' && isFriend(id, row.user_id));
  if (table === 'inventory' || table === 'user_achievements') return row.user_id === id || isFriend(id, row.user_id);
  if (table === 'friendships') return row.requester === id || row.addressee === id;
  if (table === 'cheers') return row.from_id === id || row.to_id === id;
  return true;
}
class Q {
  constructor(t) { this.t = t; this.f = []; this.ord = null; this.lim = null; this.one = false; }
  select() { return this; } eq(c, v) { this.f.push((r) => r[c] === v); return this; } neq(c, v) { this.f.push((r) => r[c] !== v); return this; }
  in(c, a) { this.f.push((r) => a.includes(r[c])); return this; }
  ilike(c, p) { const re = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i'); this.f.push((r) => re.test(r[c] || '')); return this; }
  order(c, o = {}) { this.ord = [c, o.ascending !== false]; return this; } limit(n) { this.lim = n; return this; } maybeSingle() { this.one = true; return this; }
  then(res, rej) {
    try {
      load0();
      let rows = (tables()[this.t] || []).filter((r) => visible(this.t, r) && this.f.every((f) => f(r)));
      if (this.ord) { const [c, asc] = this.ord; rows = [...rows].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
      if (this.lim) rows = rows.slice(0, this.lim);
      return Promise.resolve({ data: clone(this.one ? rows[0] || null : rows), error: null }).then(res, rej);
    } catch (e) { return Promise.resolve({ data: null, error: { message: e.message } }).then(res, rej); }
  }
}
function load0() { if (!db) load(); }

export function createMockClient() {
  load();
  const listeners = [];
  const emit = (evt, s) => listeners.forEach((l) => l(evt, s));
  const sessionObj = () => { const u = db.users.find((x) => x.id === db.session); return u ? { user: { id: u.id, email: u.email } } : null; };
  const delay = (v) => new Promise((r) => setTimeout(() => r(v), 60));
  return {
    from: (t) => new Q(t),
    rpc: async (name, args = {}) => {
      try { load0(); const fn = RPC[name]; if (!fn) throw new Error('Unknown function ' + name); const data = fn(args); save(); return await delay({ data: clone(data ?? null), error: null }); }
      catch (e) { save(); return { data: null, error: { message: e.message } }; }
    },
    auth: {
      getSession: async () => ({ data: { session: sessionObj() } }),
      onAuthStateChange: (cb) => { listeners.push(cb); return { data: { subscription: {} } }; },
      signUp: async ({ email, password, options }) => {
        const m = options?.data || {};
        if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { data: null, error: { message: 'User already registered' } };
        if (db.profiles.some((p) => p.username.toLowerCase() === (m.username || '').toLowerCase())) return { data: null, error: { message: 'Username already taken' } };
        const id = uid(), pet = ['pet_gloop', 'pet_ember', 'pet_bit'].includes(m.companion) ? m.companion : 'pet_gloop';
        db.users.push({ id, email, password });
        const p = newProfile(id, m.username, (m.character_name || m.username).slice(0, 24), m.gender === 'female' ? 'female' : 'male', Math.min(5, Math.max(0, +m.appearance || 0)), pet);
        db.profiles.push(p);
        db.inventory.push({ user_id: id, item_id: pet, equipped: true, acquired_at: new Date().toISOString() }, { user_id: id, item_id: 'theme_neon', equipped: true }, { user_id: id, item_id: 'title_novice', equipped: true });
        if (m.invite_code) { const inv = db.profiles.find((x) => x.invite_code === m.invite_code.toUpperCase()); if (inv) db.friendships.push({ id: uid(), requester: inv.id, addressee: id, status: 'accepted', created_at: new Date().toISOString() }); }
        db.session = id; save(); emit('SIGNED_IN', sessionObj());
        return { data: { session: sessionObj() }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const u = db.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
        if (!u) return { error: { message: 'Invalid login credentials' } };
        db.session = u.id; save(); emit('SIGNED_IN', sessionObj()); return { error: null };
      },
      signOut: async () => { db.session = null; save(); emit('SIGNED_OUT', null); return {}; },
    },
    storage: { from: () => ({
      upload: async (path, file) => { if (!db.session || !path.startsWith(db.session + '/')) return { error: { message: 'Not allowed' } };
        const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
        try { db.files[path] = data; save(); } catch { return { error: { message: 'Demo storage is full' } }; } return { error: null }; },
      createSignedUrl: async (path) => (db.files[path] ? { data: { signedUrl: db.files[path] }, error: null } : { data: null, error: { message: 'File not found' } }),
    }) },
  };
}
