// Data layer: Supabase client, cached game state and every server action.
// All writes go through SQL functions (see supabase/schema.sql) — the client never
// edits XP / Coins directly.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { xpNeeded } from './util.js';

const params = new URLSearchParams(location.search);
try {
  if (params.get('demo') === '1') localStorage.setItem('lq_demo', '1');
  if (params.get('demo') === '0') localStorage.removeItem('lq_demo');
} catch { /* storage unavailable */ }
let storedDemo = false;
try { storedDemo = localStorage.getItem('lq_demo') === '1'; } catch { /* storage unavailable */ }
export const DEMO = !!window.__LQ_DEMO__ || storedDemo;
export const isConfigured = DEMO || (!SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_'));

export let sb = null;

export async function initClient() {
  if (sb) return sb;
  if (DEMO) {
    const m = await import('./mock.js');
    sb = m.createMockClient();
  } else if (isConfigured) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return sb;
}

// ---------- State ---------------------------------------------------------------

export const S = {
  user: null, me: null, inv: [], shop: [], ach: [], perks: [], unlocked: new Map(), quests: [], loaded: false,
};

const unwrap = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };
export const PUBLIC_COLS = 'id,username,character_name,gender,appearance,bio,active_companion,theme,background,title,level,xp,total_xp,total_coins,quests_completed,streak,best_streak,last_active,created_at';
const rpc = async (name, args) => unwrap(await sb.rpc(name, args));

export const shopById = (id) => S.shop.find((i) => i.id === id);
export const owns = (id) => S.inv.some((i) => i.item_id === id);
export const isOn = (id) => S.inv.some((i) => i.item_id === id && i.equipped);
/** Equipped cosmetics + effect items for avatar rendering. */
export const equippedCosmetics = (inv = S.inv) =>
  inv.filter((i) => i.equipped && /^cos_/.test(i.item_id)).map((i) => i.item_id);
export const levelFx = () => {
  const f = S.inv.find((i) => i.equipped && /^fx_/.test(i.item_id));
  return f ? shopById(f.item_id)?.data?.fx || 'default' : 'default';
};
export const xpPct = (p = S.me) => (p ? Math.min(1, p.xp / xpNeeded(p.level)) : 0);

// ---------- Auth ----------------------------------------------------------------

export async function usernameAvailable(u) { return rpc('username_available', { uname: u }); }

export async function signUp(f) {
  const { data, error } = await sb.auth.signUp({
    email: f.email, password: f.password,
    options: { data: { username: f.username, character_name: f.character_name, gender: f.gender, appearance: f.appearance, companion: f.companion, invite_code: f.invite_code || '' } },
  });
  if (error) throw new Error(error.message);
  return data; // data.session is null when email confirmation is required
}
export async function signIn(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}
export async function signOut() {
  await sb.auth.signOut();
  Object.assign(S, { user: null, me: null, inv: [], quests: [], loaded: false, unlocked: new Map() });
}
export async function currentUser() {
  const { data } = await sb.auth.getSession();
  S.user = data?.session?.user || null;
  return S.user;
}

// ---------- Loading ---------------------------------------------------------------

export async function loadStatic() {
  if (S.shop.length) return;
  const [shop, ach] = await Promise.all([
    sb.from('shop_items').select('*').order('sort'),
    sb.from('achievements').select('*').order('sort'),
  ]);
  S.shop = unwrap(shop); S.ach = unwrap(ach);
  try { S.perks = unwrap(await sb.from('pet_perks').select('*')) || []; } catch { S.perks = []; } // older databases: re-run schema.sql
}

// ---------- Companion perks (display only — the server applies the real bonus) ----------
export const perkOf = (petId) => S.perks.find((p) => p.item_id === petId) || null;
export function bonusFor(petId, quest) {
  const k = perkOf(petId);
  if (!k || (k.topics && !k.topics.split(',').includes(quest.topic))) return { xp: 0, coins: 0 };
  return {
    xp: k.xp_pct > 0 ? Math.max(1, Math.round((quest.xp_reward * k.xp_pct) / 100)) : 0,
    coins: k.coin_pct > 0 ? Math.max(1, Math.round((quest.coin_reward * k.coin_pct) / 100)) : 0,
  };
}
export function perkText(petId) {
  const k = perkOf(petId); if (!k) return '';
  const what = k.xp_pct && k.coin_pct ? (k.xp_pct === k.coin_pct ? `+${k.xp_pct}% XP & Coins` : `+${k.xp_pct}% XP, +${k.coin_pct}% Coins`) : k.xp_pct ? `+${k.xp_pct}% XP` : `+${k.coin_pct}% Coins`;
  const where = k.topics ? `on ${k.topics.split(',').join(' & ')} quests` : 'on every quest';
  return `${what} ${where}`;
}

export async function refreshMe() {
  if (!S.user) return null;
  const uid = S.user.id;
  const [p, inv, ua] = await Promise.all([
    sb.rpc('my_profile'),
    sb.from('inventory').select('*').eq('user_id', uid),
    sb.from('user_achievements').select('*').eq('user_id', uid),
  ]);
  S.me = unwrap(p);
  if (S.me && !S.me.id) S.me = null; // no row yet (signup trigger still running)
  S.inv = unwrap(inv) || [];
  S.unlocked = new Map((unwrap(ua) || []).map((a) => [a.achievement_id, a.unlocked_at]));
  document.dispatchEvent(new CustomEvent('lq:me'));
  return S.me;
}

export async function bootstrap() {
  await loadStatic();
  let me = await refreshMe();
  for (let i = 0; !me && i < 4; i++) { await new Promise((r) => setTimeout(r, 400)); me = await refreshMe(); }
  if (me) {
    try { await rpc('set_tz', { mins: -new Date().getTimezoneOffset() }); } catch { /* non-fatal */ }
    S.loaded = true;
  }
  return me;
}

/** Tell the server the device's current UTC offset so its "today" matches the player's (travel, DST). */
export const syncTz = () => rpc('set_tz', { mins: -new Date().getTimezoneOffset() });

export async function loadQuests() {
  try { await syncTz(); } catch { /* non-fatal */ }
  await rpc('ensure_period_quests');
  S.quests = unwrap(await sb.from('quests').select('*').eq('user_id', S.user.id).order('created_at', { ascending: true })) || [];
  return S.quests;
}

// ---------- Quest actions ----------------------------------------------------------

export const startQuest = (qid) => rpc('start_quest', { qid });
export const completeQuest = (qid) => rpc('complete_quest', { qid });
export const deleteCustomQuest = (qid) => rpc('delete_custom_quest', { qid });
export const createCustomQuest = (q) => rpc('create_custom_quest', {
  p_name: q.name, p_desc: q.desc, p_kind: q.kind, p_topic: q.topic, p_diff: q.diff, p_proof: q.proof, p_deadline: q.deadline || null,
});

export async function submitQuest(qid, note, file) {
  let path = null;
  if (file) {
    if (file.size > 10 * 1024 * 1024) throw new Error('File is too large (max 10 MB)');
    const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-60);
    path = `${S.user.id}/${qid}/${Date.now()}-${safe}`;
    const { error } = await sb.storage.from('evidence').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('Upload failed: ' + error.message);
  }
  return rpc('submit_quest', { qid, note: note || '', path });
}

export async function evidenceUrl(path) {
  const { data, error } = await sb.storage.from('evidence').createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function pendingReviews() {
  const rows = unwrap(await sb.from('quests').select('*').eq('status', 'pending_review').neq('user_id', S.user.id).order('submitted_at', { ascending: true })) || [];
  return rows;
}
export const demoApprove = (qid) => rpc('demo_approve', { qid });
export const reviewQuest = (qid, approve, note) => rpc('review_quest', { qid, approve, note: note || '' });

export async function completedQuests(limit = 500) {
  return unwrap(await sb.from('quests').select('*').eq('user_id', S.user.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(limit)) || [];
}

// ---------- Shop / profile ------------------------------------------------------------

export const purchase = (iid) => rpc('purchase_item', { iid });
export const equip = (iid, on) => rpc('equip_item', { iid, on_off: on });
export const updateProfile = (name, appearance, bio) => rpc('update_profile', { p_char: name, p_appearance: appearance, p_bio: bio });

// ---------- Friends ---------------------------------------------------------------------

export async function loadFriendships() {
  const rows = unwrap(await sb.from('friendships').select('*')) || [];
  const ids = [...new Set(rows.flatMap((r) => [r.requester, r.addressee]))].filter((i) => i !== S.user.id);
  const profiles = ids.length ? unwrap(await sb.from('profiles').select(PUBLIC_COLS).in('id', ids)) : [];
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const view = (r) => ({ ...r, other: byId[r.requester === S.user.id ? r.addressee : r.requester] });
  return {
    friends: rows.filter((r) => r.status === 'accepted').map(view),
    incoming: rows.filter((r) => r.status === 'pending' && r.addressee === S.user.id).map(view),
    outgoing: rows.filter((r) => r.status === 'pending' && r.requester === S.user.id).map(view),
  };
}
export async function searchUsers(q) {
  const t = q.trim().replace(/[%_]/g, '');
  if (t.length < 2) return [];
  return (unwrap(await sb.from('profiles').select(PUBLIC_COLS).ilike('username', `${t}%`).neq('id', S.user.id).limit(10)) || []);
}
export const sendFriendRequest = (uname) => rpc('send_friend_request', { uname });
export const respondRequest = (fid, accept) => rpc('respond_friend_request', { fid, accept });
export const removeFriend = (fid) => rpc('remove_friend', { fid });
export const addByCode = (code) => rpc('add_friend_by_code', { code });
export const sendCheer = (to_user, k) => rpc('send_cheer', { to_user, k });

export async function loadCheers() {
  const rows = unwrap(await sb.from('cheers').select('*').eq('to_id', S.user.id).order('created_at', { ascending: false }).limit(15)) || [];
  const ids = [...new Set(rows.map((r) => r.from_id))];
  const ps = ids.length ? unwrap(await sb.from('profiles').select(PUBLIC_COLS).in('id', ids)) : [];
  const by = Object.fromEntries(ps.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, from: by[r.from_id] }));
}

export async function friendBundle(id) {
  const [p, inv, ua, ch] = await Promise.all([
    sb.from('profiles').select(PUBLIC_COLS).eq('id', id).maybeSingle(),
    sb.from('inventory').select('*').eq('user_id', id),
    sb.from('user_achievements').select('*').eq('user_id', id),
    sb.from('cheers').select('*').eq('from_id', S.user.id).eq('to_id', id),
  ]);
  return { profile: unwrap(p), inv: unwrap(inv) || [], unlocked: new Set((unwrap(ua) || []).map((a) => a.achievement_id)), cheers: unwrap(ch) || [] };
}
export const inviteLink = () => `${location.origin}${location.pathname}#/join/${S.me.invite_code}`;
